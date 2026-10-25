import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';
import * as jose from 'jose';

function compile(file,overrides){
 const mod={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,{module:mod,exports:mod.exports,require:name=>{if(Object.hasOwn(overrides,name))return overrides[name];throw new Error('Unexpected import '+name);},Date,Headers,fetch,AbortSignal,console},{filename:file});
 return mod.exports;
}
const {verifyFirebaseToken}=compile('app/firebase-token.ts',{jose});
const {privateKey,publicKey}=await jose.generateKeyPair('RS256');
const attacker=await jose.generateKeyPair('RS256');
const project='test-project-123',now=Math.floor(Date.now()/1000);
const claims={sub:'engineer-uid',iat:now,exp:now+3600,auth_time:now-60,aud:project,iss:`https://securetoken.google.com/${project}`,email:'Engineer@example.invalid',email_verified:true,firebase:{sign_in_provider:'google.com'}};
const sign=(patch={},key=privateKey,header={alg:'RS256',kid:'trusted-key'})=>new jose.SignJWT({...claims,...patch}).setProtectedHeader(header).sign(key);
const resolveKey=async kid=>{assert.equal(kid,'trusted-key');return publicKey;};
let count=0;
async function check(name,fn){await fn();count++;console.log('PASS '+name);}
const verify=token=>verifyFirebaseToken(token,project,resolveKey);
await check('valid Google signature and claims produce normalized engineer identity',async()=>{const u=await verify(await sign());assert.equal(u.email,'engineer@example.invalid');assert.equal(u.userId,'engineer-uid');assert.equal(u.provider,'firebase');});
await check('verified email/password identity is accepted',async()=>assert.equal((await verify(await sign({firebase:{sign_in_provider:'password'}}))).provider,'firebase'));
// The key is trusted independently from token contents: never use a supplied JWK or URL.
const forged=await sign({},attacker.privateKey);
await check('attacker signature is rejected',async()=>assert.rejects(()=>verify(forged)));
for(const [name,patch] of [
 ['expired',{exp:now-10}],['future issue time',{iat:now+300}],['old issue time',{iat:now-4000}],
 ['wrong audience',{aud:'other-project'}],['wrong issuer',{iss:'https://attacker.invalid'}],
 ['missing UID',{sub:undefined}],['empty UID',{sub:''}],['oversized UID',{sub:'x'.repeat(129)}],
 ['unverified email',{email_verified:false}],['string email verification',{email_verified:'true'}],['missing email',{email:undefined}],
 ['invalid email',{email:'invalid'}],['future authentication',{auth_time:now+300}],['missing authentication time',{auth_time:undefined}],
 ['anonymous sign-in',{firebase:{sign_in_provider:'anonymous'}}],['missing provider',{firebase:undefined}],['unexpected tenant',{firebase:{sign_in_provider:'password',tenant:'another-tenant'}}],
 ['missing expiry',{exp:undefined}]
])await check(name+' token is rejected',async()=>assert.rejects(()=>sign(patch).then(verify)));
await check('HMAC algorithm substitution is rejected',async()=>{const t=await new jose.SignJWT(claims).setProtectedHeader({alg:'HS256',kid:'trusted-key'}).sign(new Uint8Array(32));await assert.rejects(()=>verify(t));});
await check('unsigned and oversized tokens are rejected',async()=>{await assert.rejects(()=>verify('eyJhbGciOiJub25lIn0.e30.'));await assert.rejects(()=>verify('x'.repeat(12001)));});

let requestHeaders=new Headers(),configuration={projectId:project},platformCalls=0;
const identity=compile('app/request-identity.ts',{
 'next/headers':{headers:async()=>requestHeaders},
 './chatgpt-auth':{getChatGPTUser:async()=>{platformCalls++;return {userId:'trusted-owner',email:'admin@example.invalid'};}},
 './firebase-config':{firebaseWebConfig:()=>configuration},
 './firebase-token':{verifyFirebaseToken:(token,id)=>verifyFirebaseToken(token,id,resolveKey)}
});
await check('platform administrator identity is retained without engineer token',async()=>assert.equal((await identity.getRequestIdentity()).provider,'chatgpt'));
await check('platform transport Authorization is separate from engineer credentials',async()=>{requestHeaders=new Headers({Authorization:'Bearer platform-transport-token'});assert.equal((await identity.getRequestIdentity()).provider,'chatgpt');});
await check('engineer credential takes precedence over an existing owner session',async()=>{requestHeaders=new Headers({'X-Project-Authorization':'Bearer '+await sign()});assert.equal((await identity.getRequestIdentity()).provider,'firebase');});
for(const value of ['', 'Basic abc','Bearer invalid','Bearer '+forged])await check('invalid engineer header never falls back to owner identity',async()=>{requestHeaders=new Headers({'X-Project-Authorization':value});const before=platformCalls;await assert.rejects(()=>identity.getRequestIdentity(),e=>e.status===401);assert.equal(platformCalls,before);});
await check('unconfigured external authentication fails closed',async()=>{configuration=null;const before=platformCalls;await assert.rejects(()=>identity.getRequestIdentity(),e=>e.status===503);assert.equal(platformCalls,before);});
console.log(JSON.stringify({tests:count,result:'passed',scope:'real RSA signatures and identity dispatch; Firebase production login requires connected project'}));
