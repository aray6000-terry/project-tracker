import {env} from 'cloudflare:workers';

export function firebaseWebConfig(){
  const projectId=env.FIREBASE_PROJECT_ID?.trim();
  const apiKey=env.FIREBASE_WEB_API_KEY?.trim();
  const authDomain=env.FIREBASE_AUTH_DOMAIN?.trim();
  const appId=env.FIREBASE_APP_ID?.trim();
  if(!projectId||!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(projectId)||!apiKey||!appId||authDomain!==`${projectId}.firebaseapp.com`)return null;
  return {projectId,apiKey,authDomain,appId};
}
