import {createClient,type User} from '@supabase/supabase-js';
import {decodeJwt} from 'jose';
import {contactSchema,normalizeContact} from './contact';
import type {PublicAuthConfig} from './supabase-config';

export type ExternalIdentity={provider:'supabase';userId:string;email:string;phone:string;displayName:string};
type Lookup=(token:string)=>Promise<{data:{user:User|null};error:unknown}>;
export function verifiedIdentity(user:User):ExternalIdentity {
  if(!/^[a-f0-9-]{36}$/i.test(user.id)||user.is_anonymous!==false||user.role!=='authenticated')throw new Error('Invalid identity');
  const email=user.email_confirmed_at&&user.email?normalizeContact(user.email):'';
  const phone=user.phone_confirmed_at&&user.phone?normalizeContact('+'+user.phone.replace(/^\+/,'')):'';
  if(email&&!contactSchema.safeParse(email).success||phone&&!/^\+[1-9]\d{7,14}$/.test(phone)||!email&&!phone)throw new Error('Verified contact required');
  // user_metadata is user-editable; never use it for identity or permissions.
  return {provider:'supabase',userId:user.id,email,phone,displayName:email||phone};
}
export async function verifySupabaseToken(token:string,config:PublicAuthConfig,lookup?:Lookup):Promise<ExternalIdentity>{
  if(token.length>8192)throw new Error('Invalid token');
  // These are rejection-only checks; no decoded claim is trusted until getUser succeeds.
  const claims=decodeJwt(token),now=Math.floor(Date.now()/1000);
  if(claims.iss!==config.url+'/auth/v1'||claims.aud!=='authenticated'||claims.role!=='authenticated'||claims.is_anonymous!==false||typeof claims.exp!=='number'||claims.exp<=now||typeof claims.iat!=='number'||claims.iat>now+30||typeof claims.session_id!=='string'||!claims.session_id)throw new Error('Invalid token');
  let read=lookup;
  if(!read){const client=createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:(input,init)=>fetch(input,{...init,redirect:'error',signal:AbortSignal.timeout(10000)})}});read=jwt=>client.auth.getUser(jwt);}
  const {data,error}=await read(token);
  if(error||!data.user||data.user.id!==claims.sub)throw new Error('Token verification failed');
  return verifiedIdentity(data.user);
}
