import {supabaseWebConfig} from '../../../supabase-config';
export const dynamic='force-dynamic';
export function GET(){const config=supabaseWebConfig();return Response.json({enabled:!!config&&Object.values(config.methods).some(Boolean),config},{headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
