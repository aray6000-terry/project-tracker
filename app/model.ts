import { z } from 'zod';
import data from './data/training.json';
export const tasks = data.checklist;
export const stationNames = ['線路與供電','網路與設備','點位與聯動','專案交付'];
export const skillNames = ['安全與界面','識圖與估量','線材與電源','系統設定','BMS與通訊','品質與排程','採購變更成本','測試除錯交付'];
export const statusNames:Record<string,string>={todo:'未開始',active:'進行中',blocked:'受阻',done:'已完成'};
const txt=z.string().max(6000); const short=z.string().max(200);
const date=z.string().refine(v=>!v||/^\d{4}-\d{2}-\d{2}$/.test(v)&&!isNaN(Date.parse(v)), '日期格式錯誤');
const evidence=txt.refine(v=>!v||/^https?:\/\/[^\s]+$/i.test(v),'證據請填完整 http 或 https 連結');
export const taskBaseSchema=z.object({status:z.enum(['todo','active','blocked','done']),owner:short,due:date,evidence,reviewer:short,reviewDate:date,notes:txt,actualHours:z.number().min(0).max(1000)}).strict();
export const taskSchema=taskBaseSchema.superRefine((v,c)=>{if(v.status==='done'&&(!v.owner.trim()||!v.evidence||!v.reviewer.trim()||!v.reviewDate))c.addIssue({code:'custom',message:'完成任務須填負責人、證據連結、覆核人及覆核日期'});if(v.status==='blocked'&&!v.notes.trim())c.addIssue({code:'custom',message:'受阻任務須填原因與下一步'});});
export type TaskRecord=z.infer<typeof taskSchema>;
export const emptyTask:TaskRecord={status:'todo',owner:'',due:'',evidence:'',reviewer:'',reviewDate:'',notes:'',actualHours:0};
const score=z.number().min(0).max(100).nullable();
const assessment=z.object({scores:z.array(score).length(4),safe:z.boolean(),docs:z.boolean(),issuesClosed:z.boolean(),evidence,mentor:short,manager:short,date,notes:txt}).strict();
const station=z.object({score,safe:z.boolean(),evidence,reviewer:short,date}).strict();
const skill=z.object({level:z.number().int().min(0).max(4).nullable(),evidence,reviewer:short,date}).strict();
export const emptyAssessment={scores:[null,null,null,null] as (number|null)[],safe:false,docs:false,issuesClosed:false,evidence:'',mentor:'',manager:'',date:'',notes:''};
export const emptyStation={score:null as number|null,safe:false,evidence:'',reviewer:'',date:''};
export const emptySkill={level:null as number|null,evidence:'',reviewer:'',date:''};
const taskIDs=new Set(tasks.map(t=>t.id));
export const projectSchema=z.object({id:z.string().regex(/^[a-z0-9-]{1,80}$/),name:short.min(1),learner:short,mentor:short,startDate:date,tasks:z.record(taskSchema).refine(v=>Object.keys(v).every(k=>taskIDs.has(k)),'任務編號不符版本'),assessments:z.record(assessment).refine(v=>Object.keys(v).every(k=>/^[1-6]$/.test(k))),stations:z.record(station).refine(v=>Object.keys(v).every(k=>/^[0-3]$/.test(k))),skills:z.record(skill).refine(v=>Object.keys(v).every(k=>/^[0-7]$/.test(k)))}).strict();
export const stateSchema=z.object({schemaVersion:z.literal(1),projects:z.array(projectSchema).min(1).max(30)}).strict().refine(v=>new Set(v.projects.map(p=>p.id)).size===v.projects.length,'專案ID重複');
export type State=z.infer<typeof stateSchema>;export type Project=z.infer<typeof projectSchema>;
export function initialState():State{return stateSchema.parse(data.initialState);}
export function dueDate(t:typeof tasks[number],p:Project){const r=p.tasks[t.id];if(r?.due)return r.due;if(!t.week||!p.startDate)return '';const d=new Date(p.startDate+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+t.week*7-1);return d.toISOString().slice(0,10);}
export function today(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function stationPassed(s:typeof emptyStation){return s.score!==null&&s.score>=80&&s.safe&&!!s.evidence&&!!s.reviewer.trim()&&!!s.date;}
export function skillPassed(s:typeof emptySkill){return s.level!==null&&s.level>=3&&!!s.evidence&&!!s.reviewer.trim()&&!!s.date;}
export function assessmentResult(p:Project,n:number){const a=p.assessments[String(n)];if(!a||a.scores.some(x=>x===null))return {label:'待評分',passed:false,total:null};const total=a.scores.reduce<number>((s,x,i)=>s+(x||0)*[.2,.4,.2,.2][i],0);if(a.scores.some(x=>(x||0)<80)||total<80||!a.safe)return {label:'需補訓／安全確認',passed:false,total};if(!a.docs||!a.issuesClosed||!a.evidence)return {label:'待完成條件',passed:false,total};if(n===6&&(!stationNames.every((_,i)=>stationPassed(p.stations[i]||emptyStation))||!skillNames.every((_,i)=>skillPassed(p.skills[i]||emptySkill))))return {label:'待實作與能力達標',passed:false,total};if(!a.mentor.trim()||!a.manager.trim()||!a.date)return {label:'待簽認',passed:false,total};return {label:'通過',passed:true,total};}
export function csvCell(v:unknown){let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}

// Public API uses an allowlist projection; private records are never sent to anonymous viewers.
export const publicStateSchema=z.object({schemaVersion:z.literal(1),projects:z.array(projectSchema.extend({tasks:z.record(taskBaseSchema)})).min(1).max(30)}).strict();
export const publicSummarySchema=z.record(z.object({hours:z.number().min(0),stages:z.array(z.boolean()).length(6)}).strict());
export type PublicSummary=z.infer<typeof publicSummarySchema>;
export function publicProjection(state:State){
 const summary:PublicSummary={};
 const projects=state.projects.map(p=>{
  summary[p.id]={hours:tasks.filter(t=>t.category==='培訓指導').reduce((s,t)=>s+(p.tasks[t.id]?.actualHours||0),0),stages:[1,2,3,4,5,6].map(n=>assessmentResult(p,n).passed)};
  const records:Record<string,TaskRecord>={};
  for(const [id,r] of Object.entries(p.tasks))records[id]={...emptyTask,status:r.status,due:r.due};
  return {id:p.id,name:p.name,learner:'',mentor:'',startDate:p.startDate,tasks:records,assessments:{},stations:{},skills:{}};
 });
 return {state:{schemaVersion:1 as const,projects},summary};
}
