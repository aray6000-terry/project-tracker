import {firebaseWebConfig} from '../../../firebase-config';
export const dynamic='force-dynamic';
export function GET(){const config=firebaseWebConfig();return Response.json({enabled:!!config,config},{headers:{'Cache-Control':'no-store'}});}
