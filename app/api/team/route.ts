import {actor,team,setMember,json,failure,body} from '../../team-store';
export const dynamic='force-dynamic';
export async function GET(){try{return json({members:await team(await actor())});}catch(e){return failure(e);}}
export async function POST(r:Request){try{const v=await body(r,10000);return json(await setMember(await actor(),v));}catch(e){return failure(e);}}
