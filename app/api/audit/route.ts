import {actor,audit,json,failure} from '../../team-store';
export const dynamic='force-dynamic';
export async function GET(){try{return json({events:await audit(await actor())});}catch(e){return failure(e);}}
