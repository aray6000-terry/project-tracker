import {z} from 'zod';
export function normalizeContact(input:string){
  const value=input.trim();
  // Accept Taiwan local mobile format or an explicit international country code.
  if(/^09\d{8}$/.test(value.replace(/[\s()-]/g,'')))return '+886'+value.replace(/[\s()-]/g,'').slice(1);
  if(value.startsWith('+'))return value.replace(/[\s()-]/g,'');
  return value.toLowerCase();
}
export const contactSchema=z.string().max(254).transform(normalizeContact).refine(value=>z.string().email().safeParse(value).success||/^\+[1-9]\d{7,14}$/.test(value),'請輸入有效的 Email 或含國碼的手機號碼，例如 +886912345678。');
