'use client';
import type {SupabaseClient} from '@supabase/supabase-js';
import type {PublicAuthConfig} from './supabase-config';
export type AuthSetup={enabled:boolean;config:PublicAuthConfig|null};
let setupPromise:Promise<AuthSetup>|undefined,clientPromise:Promise<SupabaseClient|null>|undefined;
export function authSetup(){return setupPromise??=(async()=>{const r=await fetch('/api/auth/config',{cache:'no-store',redirect:'error'});if(!r.ok)throw new Error('無法讀取登入設定，請重新整理。');return await r.json() as AuthSetup;})().catch(e=>{setupPromise=undefined;throw e;});}
export function clientAuth(){return clientPromise??=(async()=>{
 const {config}=await authSetup();if(!config)return null;
 const {createClient}=await import('@supabase/supabase-js');
 return createClient(config.url,config.publishableKey,{auth:{persistSession:true,storage:window.sessionStorage,storageKey:'zongya-auth-v1',autoRefreshToken:true,detectSessionInUrl:false,flowType:'pkce'}});
})().catch(e=>{clientPromise=undefined;throw e;});}
export async function authenticatedFetch(path:string,init:RequestInit={}){
 const url=new URL(path,window.location.origin);
 if(url.origin!==window.location.origin||!url.pathname.startsWith('/api/'))throw new Error('不允許將登入憑證傳往其他網站。');
 const client=await clientAuth(),requestHeaders=new Headers(init.headers);
 if(client){const {data,error}=await client.auth.getSession();if(error)throw new Error('登入已失效，請重新登入。');if(data.session)requestHeaders.set('X-Project-Authorization','Bearer '+data.session.access_token);}
 return fetch(url,{...init,headers:requestHeaders,credentials:'same-origin',redirect:'error'});
}
export async function engineerSignOut(){const client=await clientAuth();if(client){const {error}=await client.auth.signOut({scope:'local'});if(error)throw new Error('登出未完成，請確認連線後重試。');}}
export async function administratorSignIn(){await engineerSignOut();window.location.assign('/signin-with-chatgpt?return_to=%2F');}
