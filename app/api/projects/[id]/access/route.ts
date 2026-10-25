import {actor,grants,grant,json,failure,body} from '../../../../team-store';
export const dynamic='force-dynamic';
type C={params:Promise<{id:string}>};
export async function GET(_r:Request,c:C){try{return json({grants:await grants(await actor(),(await c.params).id)});}catch(e){return failure(e);}}
export async function POST(r:Request,c:C){try{const v=await body(r,10000);return json(await grant(await actor(),(await c.params).id,v));}catch(e){return failure(e);}}
