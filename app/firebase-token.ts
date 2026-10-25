import {decodeProtectedHeader,importX509,jwtVerify} from 'jose';

const CERT_URL='https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cached:{expires:number;certs:Record<string,string>}|undefined;
async function googleKey(kid:string){
  if(!cached||cached.expires<=Date.now()){
    const r=await fetch(CERT_URL,{redirect:'error',signal:AbortSignal.timeout(5000)});
    if(!r.ok)throw new Error('Identity key service unavailable');
    const certs=await r.json() as Record<string,string>;
    if(!certs||Array.isArray(certs)||Object.keys(certs).length>20||Object.values(certs).some(v=>typeof v!=='string'||v.length>12000))throw new Error('Invalid identity keys');
    const seconds=Number(r.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1]||300);
    cached={certs,expires:Date.now()+Math.min(seconds,3600)*1000};
  }
  if(!Object.hasOwn(cached.certs,kid))throw new Error('Unknown signing key');
  return importX509(cached.certs[kid],'RS256');
}

export async function verifyFirebaseToken(token:string,projectId:string,keyFor:(kid:string)=>Promise<CryptoKey>=googleKey){
  if(token.length>12000||!projectId)throw new Error('Invalid identity token');
  const header=decodeProtectedHeader(token);
  if(header.alg!=='RS256'||!header.kid||header.kid.length>128)throw new Error('Invalid signing algorithm');
  const key=await keyFor(header.kid);
  const {payload:p}=await jwtVerify(token,key,{algorithms:['RS256'],issuer:`https://securetoken.google.com/${projectId}`,audience:projectId,requiredClaims:['sub','iat','exp','auth_time','email','email_verified'],maxTokenAge:'1h',clockTolerance:0});
  const now=Math.floor(Date.now()/1000);
  const firebase=p.firebase as {sign_in_provider?:string;tenant?:string}|undefined;
  if(!p.sub||p.sub.length>128||typeof p.iat!=='number'||p.iat>now||typeof p.auth_time!=='number'||p.auth_time>now||p.auth_time<0)throw new Error('Invalid identity timestamps');
  if(p.email_verified!==true||typeof p.email!=='string'||p.email.length>254||!/^\S+@\S+\.\S+$/.test(p.email))throw new Error('Verified email required');
  if(!firebase||!['google.com','password'].includes(firebase.sign_in_provider||'')||firebase.tenant)throw new Error('Unsupported identity provider');
  return {userId:p.sub,email:p.email.trim().toLowerCase(),displayName:typeof p.name==='string'?p.name.slice(0,200):p.email,provider:'firebase' as const};
}
