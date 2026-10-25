import {actor,json,failure,db,AccessError} from '../../team-store';
import {getRequestIdentity} from '../../request-identity';
export const dynamic='force-dynamic';
export async function GET(){try{const u=await getRequestIdentity();if(!u)return json({status:'anonymous'});try{const a=await actor();const setting=await db().prepare("SELECT value FROM system_settings WHERE key='backup_status'").first<{value:string}>();return json({status:'active',user:a,backupStatus:setting?JSON.parse(setting.value):{enabled:false,message:'Drive備份通道待完成驗證'}});}catch(e){if(e instanceof AccessError&&e.status===403)return json({status:'pending',email:u.email});throw e;}}catch(e){return failure(e);}}
