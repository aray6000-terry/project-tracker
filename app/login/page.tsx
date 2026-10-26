'use client';
import {useEffect,useState} from 'react';
import {ShieldCheck,ArrowLeft,LogIn,Mail,Smartphone,RefreshCw} from 'lucide-react';
import {clientAuth,authSetup,administratorSignIn,type AuthSetup} from '../auth-client';
import {contactSchema,normalizeContact} from '../contact';
function friendly(error:unknown){
 const code=(error as {code?:string})?.code;
 if(['over_request_rate_limit','over_email_send_rate_limit','over_sms_send_rate_limit'].includes(code||''))return '發送或嘗試次數較多，請稍後再試。';
 if(['otp_expired','otp_disabled'].includes(code||''))return '驗證碼不正確或已過期，請確認後重試或重新發送。';
 if(['provider_disabled','email_provider_disabled','phone_provider_disabled','sms_send_failed'].includes(code||''))return '此登入方式暫時無法使用，請聯絡管理者或選擇其他方式。';
 if(code)return '驗證未完成，請確認資料後重試或聯絡管理者。';
 return error instanceof Error?error.message:'操作未完成，請稍後再試。';
}
export default function Login(){
 const [setup,setSetup]=useState<AuthSetup|null>(null),[ready,setReady]=useState(false),[mode,setMode]=useState<'email'|'phone'>('email');
 const [contact,setContact]=useState(''),[sentTo,setSentTo]=useState(''),[otp,setOtp]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[cooldown,setCooldown]=useState(0);
 useEffect(()=>{let active=true;authSetup().then(s=>{if(active){setSetup(s);setReady(true);if(!s.config?.methods.email&&s.config?.methods.phone)setMode('phone');}}).catch(e=>{if(active){setError(friendly(e));setReady(true);}});return()=>{active=false;};},[]);
 useEffect(()=>{if(cooldown<=0)return;const timer=window.setTimeout(()=>setCooldown(x=>Math.max(0,x-1)),1000);return()=>window.clearTimeout(timer);},[cooldown]);
 async function run(action:()=>Promise<void>){if(busy)return;setBusy(true);setError('');setNotice('');try{await action();}catch(e){setError(friendly(e));}finally{setBusy(false);}}
 async function send(){
  if(!setup?.config?.methods[mode])throw new Error('此登入方式尚未啟用。');
  const target=normalizeContact(contact),valid=contactSchema.safeParse(target);
  if(!valid.success||mode==='phone'&&!target.startsWith('+')||mode==='email'&&!target.includes('@'))throw new Error(mode==='phone'?'請輸入09開頭的台灣手機，或含國碼的手機號碼。':'請輸入完整的Email。');
  const client=await clientAuth();if(!client)throw new Error('登入服務尚未啟用。');
  const result=mode==='email'?await client.auth.signInWithOtp({email:target,options:{shouldCreateUser:true,emailRedirectTo:window.location.origin+'/auth/complete'}}):await client.auth.signInWithOtp({phone:target,options:{shouldCreateUser:true,channel:'sms'}});
  if(result.error)throw result.error;
  setSentTo(target);setOtp('');setCooldown(60);setNotice('已提出驗證碼發送請求，請查看'+(mode==='email'?'收件匣與垃圾郵件。':'手機簡訊。'));
 }
 async function verify(){
  if(!/^\d{6,10}$/.test(otp))throw new Error('請輸入通知中的完整數字驗證碼。');
  const client=await clientAuth();if(!client)throw new Error('登入服務尚未啟用。');
  const {data,error}=mode==='email'?await client.auth.verifyOtp({email:sentTo,token:otp,type:'email'}):await client.auth.verifyOtp({phone:sentTo,token:otp,type:'sms'});
  if(error)throw error;if(!data.session)throw new Error('登入尚未完成，請重新取得驗證碼。');
  setOtp('');window.location.replace('/');
 }
 const methods=setup?.config?.methods;
 return <div className="login-shell"><header className="login-header"><a href="/" className="brand portal-brand"><div className="brand-mark">宗</div><div><strong>宗亞資訊</strong><span>PROJECT WORKSPACE</span></div></a><a href="/" className="button"><ArrowLeft size={17}/>回首頁</a></header><main className="login-main"><div className="login-intro"><span className="eyebrow">YOUR PROJECTS · YOUR ACCESS</span><h1>用熟悉的方式，<br/>登入你的專案。</h1><p>Google帳號、Email或手機驗證碼。<br/>不需要GitHub或ChatGPT帳號，也不用安裝工具。</p><div className="login-assurance"><ShieldCheck size={22}/><span>由管理者核准成員與指派專案，<br/>登入後只顯示你獲授權的內容。</span></div></div><section className="panel login-card">
 {!ready?<p className="login-loading"><RefreshCw className="spin"/>準備登入服務…</p>:<>
 {!setup?.enabled&&<div className="login-message" role="status"><strong>工程師登入設定中</strong><p>管理者正在完成登入服務設定。開放後即可使用下方已啟用的方式。</p></div>}
 <h2>{sentTo?'輸入驗證碼':'選擇登入方式'}</h2>
 {!sentTo&&<><button className="google-login" disabled={busy||!methods?.google} onClick={()=>run(async()=>{const client=await clientAuth();if(!client)throw new Error('登入服務尚未啟用。');const {error}=await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:window.location.origin+'/auth/complete',queryParams:{prompt:'select_account'}}});if(error)throw error;})}><span aria-hidden="true">G</span>使用Google登入{!methods?.google?'（設定中）':''}</button><div className="login-divider">或使用驗證碼，不用記密碼</div>
 <div className="login-tabs" role="group" aria-label="驗證碼寄送方式"><button className={mode==='email'?'selected':''} aria-pressed={mode==='email'} disabled={busy||!methods?.email} onClick={()=>{setMode('email');setContact('');setError('');setNotice('');}}><Mail size={17}/>Email{!methods?.email?'（設定中）':''}</button><button className={mode==='phone'?'selected':''} aria-pressed={mode==='phone'} disabled={busy||!methods?.phone} onClick={()=>{setMode('phone');setContact('');setError('');setNotice('');}}><Smartphone size={17}/>手機{!methods?.phone?'（設定中）':''}</button></div></>}
 <form onSubmit={e=>{e.preventDefault();run(sentTo?verify:send);}}>
 {sentTo?<><p className="login-destination">驗證碼收件對象：<strong>{sentTo}</strong></p><label>驗證碼<input className="otp-input" type="text" inputMode="numeric" autoComplete="one-time-code" autoFocus required pattern="[0-9]{6,10}" minLength={6} maxLength={10} value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}/></label><button className="primary" disabled={busy}>{busy?'驗證中…':'驗證並登入'}<LogIn size={18}/></button><div className="button-row"><button type="button" disabled={busy||cooldown>0} onClick={()=>run(send)}>{cooldown>0?`${cooldown}秒後可重寄`:'重新發送驗證碼'}</button><button type="button" disabled={busy} onClick={()=>{setSentTo('');setOtp('');setNotice('');setError('');}}>更換聯絡方式</button></div></>:<><label>{mode==='email'?'Email信箱':'手機號碼'}<input type={mode==='email'?'email':'tel'} inputMode={mode==='email'?'email':'tel'} autoComplete={mode==='email'?'email':'tel'} autoCapitalize="none" spellCheck={false} required maxLength={254} disabled={busy||!methods?.[mode]} placeholder={mode==='email'?'你的Email信箱':'09開頭，或含國碼 +886…'} value={contact} onChange={e=>setContact(e.target.value)}/></label><button className="primary" disabled={busy||!methods?.[mode]||cooldown>0}>{busy?'處理中…':cooldown>0?`${cooldown}秒後可重寄`:'取得驗證碼'}<LogIn size={18}/></button></>}
 </form><p className="muted">完成驗證後，仍須由管理者核准帳號及指派專案。共用裝置使用完畢請登出。</p></>}
 {error&&<p className="login-message error" role="alert">{error}</p>}{notice&&<p className="login-message" role="status">{notice}</p>}
 </section></main><footer className="login-footer"><span>宗亞資訊 · 授權成員專用</span><button className="text-button" disabled={busy} onClick={()=>run(administratorSignIn)}>管理者入口</button></footer></div>;
}
