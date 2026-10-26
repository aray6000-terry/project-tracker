import {env} from 'cloudflare:workers';

export type LoginMethods={email:boolean;google:boolean;phone:boolean};
export type PublicAuthConfig={url:string;publishableKey:string;methods:LoginMethods};
export function supabaseWebConfig():PublicAuthConfig|null {
  const url=env.SUPABASE_URL?.trim().replace(/\/$/,''),publishableKey=env.SUPABASE_PUBLISHABLE_KEY?.trim();
  // Only a configured project and a publishable key may reach browser code.
  if(!url||!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url)||!publishableKey||!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey))return null;
  return {url,publishableKey,methods:{email:env.AUTH_EMAIL_READY==='true',google:env.AUTH_GOOGLE_READY==='true',phone:env.AUTH_PHONE_READY==='true'}};
}
