import {actor,listProjects,createProject,json,failure,body} from '../../team-store';
export const dynamic='force-dynamic';
export async function GET(){try{return json({projects:await listProjects(await actor())});}catch(e){return failure(e);}}
export async function POST(r:Request){try{const input=await body(r,10000);return json(await createProject(await actor(),input),201);}catch(e){return failure(e);}}
