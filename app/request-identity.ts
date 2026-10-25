import {headers} from 'next/headers';
import {getChatGPTUser} from './chatgpt-auth';
import {firebaseWebConfig} from './firebase-config';
import {verifyFirebaseToken} from './firebase-token';

export class IdentityError extends Error{constructor(public status:number,message:string){super(message);}}
export async function getRequestIdentity(){
  // Use a separate header so the platform's MCP authorization is untouched.
  const value=(await headers()).get('x-project-authorization');
  // An invalid external token never falls back to a platform identity.
  if(value!==null){
    const config=firebaseWebConfig();
    if(!config)throw new IdentityError(503,'工程師登入服務尚未啟用。');
    const match=value.match(/^Bearer ([A-Za-z0-9._-]+)$/);
    if(!match)throw new IdentityError(401,'登入憑證無效，請重新登入。');
    try{return await verifyFirebaseToken(match[1],config.projectId);}
    catch{throw new IdentityError(401,'登入已失效或信箱尚未驗證，請重新登入。');}
  }
  const user=await getChatGPTUser();
  return user?{...user,provider:'chatgpt' as const}:null;
}
