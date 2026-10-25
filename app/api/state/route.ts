import {json} from '../../team-store';
export const dynamic='force-dynamic';
// Old bulk/public endpoint is retired. Real projects are always permission-scoped.
export async function GET(){return json({error:'請登入工作區查看獲授權專案。'},401);}
export async function PUT(){return json({error:'舊版整批儲存已停用，請重新載入新版工作區。'},410);}
