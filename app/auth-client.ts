'use client';
import type {Auth} from 'firebase/auth';
import type {FirebaseOptions} from 'firebase/app';

let pending:Promise<Auth|null>|undefined;
export function clientAuth(){
  return pending??=(async()=>{
    const r=await fetch('/api/auth/config',{cache:'no-store'});
    if(!r.ok)throw new Error('無法讀取登入設定，請重新整理。');
    const {enabled,config}=await r.json() as {enabled:boolean;config:FirebaseOptions|null};
    if(!enabled)return null;
    if(!config)throw new Error('登入設定不完整，請聯絡管理者。');
    const [{initializeApp,getApps},{getAuth,setPersistence,browserSessionPersistence}]=await Promise.all([import('firebase/app'),import('firebase/auth')]);
    const app=getApps().find(a=>a.name==='project-tracker')||initializeApp(config,'project-tracker');
    const auth=getAuth(app);auth.languageCode='zh-TW';
    await setPersistence(auth,browserSessionPersistence);
    await auth.authStateReady();
    return auth;
  })().catch(e=>{pending=undefined;throw e;});
}

export async function authenticatedFetch(path:string,init:RequestInit={}){
  const url=new URL(path,window.location.origin);
  if(url.origin!==window.location.origin||!url.pathname.startsWith('/api/'))throw new Error('不允許將登入憑證傳往其他網站。');
  const auth=await clientAuth();
  const requestHeaders=new Headers(init.headers);
  if(auth?.currentUser)requestHeaders.set('X-Project-Authorization','Bearer '+await auth.currentUser.getIdToken());
  return fetch(url,{...init,headers:requestHeaders,credentials:'same-origin',redirect:'error'});
}

export async function engineerSignOut(){const auth=await clientAuth();if(auth)await (await import('firebase/auth')).signOut(auth);}
export async function administratorSignIn(){await engineerSignOut();window.location.assign('/signin-with-chatgpt?return_to=%2F');}
