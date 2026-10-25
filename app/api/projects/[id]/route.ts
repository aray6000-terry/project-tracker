import {actor,permit,saveProject,json,failure,body,archiveInfo} from '../../../team-store';
import privateDocuments from '../../../private-documents.json';
export const dynamic='force-dynamic';
type C={params:Promise<{id:string}>};
export async function GET(_r:Request,c:C){try{const a=await actor(),{id}=await c.params,p=await permit(a,id);return json({project:JSON.parse(p.row.payload),revision:p.row.revision,updatedAt:p.row.updated_at,permissions:{canEdit:p.canEdit,canShare:p.canShare,admin:a.admin},...(a.admin?{...privateDocuments,archive:await archiveInfo(id)}:{documents:[],driveFolder:''})});}catch(e){return failure(e);}}
export async function PUT(r:Request,c:C){try{const v=await body(r);return json(await saveProject(await actor(),(await c.params).id,v));}catch(e){return failure(e);}}
