import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {stateSchema,initialState,publicProjection,publicStateSchema,publicSummarySchema} from '../../model';
import {isAdministrator} from '../../server-access';
import privateDocuments from '../../private-documents.json';
export const dynamic='force-dynamic';
const PUBLIC_KEY='__public_progress_v1__';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await getChatGPTUser();const admin=isAdministrator(user,env.TRAINING_ADMIN_EMAIL);
 try{
  if(!env.DB)throw new Error('Database unavailable');
  const owner=admin&&user?user.userId:PUBLIC_KEY;
  const row=await env.DB.prepare('SELECT payload, revision, updated_at FROM training_states WHERE owner = ?').bind(owner).first<{payload:string;revision:number;updated_at:string}>();
  if(admin)return reply({role:'admin',state:row?stateSchema.parse(JSON.parse(row.payload)):initialState(),revision:row?.revision||0,updatedAt:row?.updated_at||null,...privateDocuments});
  const snapshot=row?JSON.parse(row.payload):publicProjection(initialState());
  return reply({role:'viewer',state:publicStateSchema.parse(snapshot.state),summary:publicSummarySchema.parse(snapshot.summary),revision:row?.revision||0,updatedAt:row?.updated_at||null});
 }catch{return reply({error:'暫時無法讀取進度，請稍後重新載入。'},503);}
}
export async function PUT(request:Request){
 const user=await getChatGPTUser();
 if(!user)return reply({error:'公開頁面僅供查看，修改須由管理者登入。'},401);
 if(!isAdministrator(user,env.TRAINING_ADMIN_EMAIL))return reply({error:'此帳號沒有修改進度的權限。'},403);
 const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return reply({error:'不接受跨網站寫入。'},403);
 try{
  if(!env.DB)throw new Error('Database unavailable');
  const raw=await request.text();if(raw.length>1500000)return reply({error:'資料過大。'},413);
  const body=JSON.parse(raw);if(!Number.isInteger(body.revision)||body.revision<0)return reply({error:'版本無效。'},400);
  const parsed=stateSchema.safeParse(body.state);if(!parsed.success)return reply({error:parsed.error.issues[0]?.message||'資料格式不符。'},400);
  const updatedAt=new Date().toISOString(),revision=body.revision+1,payload=JSON.stringify(parsed.data),publicPayload=JSON.stringify(publicProjection(parsed.data));
  const own=body.revision===0
   ?env.DB.prepare('INSERT INTO training_states (owner,payload,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(owner) DO NOTHING RETURNING revision').bind(user.userId,payload,updatedAt)
   :env.DB.prepare('UPDATE training_states SET payload=?,revision=?,updated_at=? WHERE owner=? AND revision=? RETURNING revision').bind(payload,revision,updatedAt,user.userId,body.revision);
  // Same transaction: publish only the exact payload/revision accepted by the optimistic update.
  const publish=env.DB.prepare('INSERT INTO training_states (owner,payload,revision,updated_at) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM training_states WHERE owner=? AND revision=? AND payload=?) ON CONFLICT(owner) DO UPDATE SET payload=excluded.payload,revision=excluded.revision,updated_at=excluded.updated_at WHERE excluded.revision >= training_states.revision').bind(PUBLIC_KEY,publicPayload,revision,updatedAt,user.userId,revision,payload);
  const results=await env.DB.batch([own,publish]);
  if(!results[0].results?.length)return reply({error:'其他視窗已更新進度。請先匯出備份，再重新載入最新版本。'},409);
  return reply({revision,updatedAt,published:true});
 }catch{return reply({error:'未能儲存。資料仍在本頁，請匯出備份後重試。'},500);}
}
