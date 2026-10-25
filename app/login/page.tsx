'use client';
import {useEffect,useState} from 'react';
import type {Auth,User} from 'firebase/auth';
import {GoogleAuthProvider,signInWithPopup,signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail,signOut,onAuthStateChanged,validatePassword} from 'firebase/auth';
import {ShieldCheck,ArrowLeft,LogIn,Mail,RefreshCw} from 'lucide-react';
import {clientAuth,administratorSignIn} from '../auth-client';

function friendly(error:unknown){
 const code=(error as {code?:string})?.code;
 const messages:Record<string,string>={
  'auth/invalid-credential':'信箱或密碼不正確，請重新確認。',
  'auth/invalid-email':'請填寫完整的電子郵件信箱。',
  'auth/email-already-in-use':'此信箱已有帳號，請使用登入或忘記密碼。',
  'auth/weak-password':'密碼不符合安全要求，請依提示重新設定。',
  'auth/too-many-requests':'嘗試次數過多，請稍後再試。',
  'auth/popup-blocked':'瀏覽器阻擋了登入視窗，請允許此網站的彈出視窗，或改用信箱登入。',
  'auth/popup-closed-by-user':'登入視窗已關閉，您可以重新選擇登入方式。',
  'auth/operation-not-allowed':'此登入方式尚未啟用，請聯絡管理者。',
  'auth/unauthorized-domain':'此網站尚未完成登入網域設定，請聯絡管理者。',
  'auth/network-request-failed':'網路連線未完成，請確認連線後重試。',
  'auth/account-exists-with-different-credential':'此信箱已使用其他方式註冊，請使用原本的登入方式。'
 };
 return code?messages[code]||'登入未完成，請重試或聯絡管理者。':error instanceof Error?error.message:'操作未完成，請稍後再試。';
}

export default function Login(){
 const [auth,setAuth]=useState<Auth|null>(null),[ready,setReady]=useState(false),[user,setUser]=useState<User|null>(null);
 const [mode,setMode]=useState<'login'|'register'|'reset'>('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[visible,setVisible]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 useEffect(()=>{let active=true;let unsubscribe:(()=>void)|undefined;clientAuth().then(a=>{if(!active)return;setAuth(a);setReady(true);if(a)unsubscribe=onAuthStateChanged(a,setUser);}).catch(e=>{if(active){setError(friendly(e));setReady(true);}});return()=>{active=false;unsubscribe?.();};},[]);
 async function run(action:()=>Promise<void>){if(busy)return;setBusy(true);setError('');setNotice('');try{await action();}catch(e){setError(friendly(e));}finally{setBusy(false);}}
 function finish(u:User){setPassword('');setConfirm('');if(u.emailVerified)window.location.assign('/');else setUser(u);}
 async function submit(){
  if(!auth)return;
  if(mode==='reset'){
   try{await sendPasswordResetEmail(auth,email,{url:window.location.origin+'/login'});}catch(e){if(!['auth/user-not-found','auth/invalid-credential'].includes((e as {code:string}).code))throw e;}
   setNotice('若此信箱可使用密碼登入，將收到重設通知；請檢查收件匣與垃圾郵件。');return;
  }
  if(mode==='register'){
   if(password.length<12||password.length>128)throw new Error('請使用12至128個字元的密碼。');
   if(password!==confirm)throw new Error('兩次輸入的密碼不一致。');
   const policy=await validatePassword(auth,password);if(!policy.isValid)throw new Error('密碼不符合帳號安全要求，請使用更長且含英數與符號的密碼。');
   const {user:u}=await createUserWithEmailAndPassword(auth,email,password);setUser(u);setPassword('');setConfirm('');
   await sendEmailVerification(u,{url:window.location.origin+'/login'});setNotice('驗證信已寄出，完成信箱驗證後回來按「我已完成驗證」。');return;
  }
  finish((await signInWithEmailAndPassword(auth,email,password)).user);
 }
 return <div className="login-shell"><header className="login-header"><a href="/" className="brand portal-brand"><div className="brand-mark">宗</div><div><strong>宗亞資訊</strong><span>PROJECT WORKSPACE</span></div></a><a href="/" className="button"><ArrowLeft size={17}/>回首頁</a></header><main className="login-main"><div className="login-intro"><span className="eyebrow">YOUR PROJECTS · YOUR ACCESS</span><h1>工程師登入</h1><p>使用Google帳號或自己的信箱密碼。<br/>不需要ChatGPT帳號。</p><div className="login-assurance"><ShieldCheck size={22}/><span>帳號經管理者核准後，<br/>只會看到指派給你的專案。</span></div></div><section className="panel login-card">
 {!ready?<p className="login-loading"><RefreshCw className="spin"/>準備登入服務…</p>:!auth?<><h2>工程師登入尚未啟用</h2><p>管理者正在完成帳號服務設定。啟用後即可使用Google帳號或信箱密碼登入。</p><button onClick={()=>run(administratorSignIn)}>管理者設定入口</button></>:user&&!user.emailVerified?<><Mail size={32}/><h2>請先驗證信箱</h2><p>目前帳號：<strong>{user.email}</strong></p><p>開啟驗證信中的連結，完成後回到這裡。驗證完成仍需要管理者核准帳號及指派專案。</p><button className="primary" disabled={busy} onClick={()=>run(async()=>{await user.reload();await user.getIdToken(true);if(!user.emailVerified)throw new Error('尚未完成信箱驗證，請先開啟驗證信中的連結。');finish(user);})}>我已完成驗證</button><div className="button-row"><button disabled={busy} onClick={()=>run(async()=>{await sendEmailVerification(user,{url:window.location.origin+'/login'});setNotice('驗證信已重新寄出。');})}>重寄驗證信</button><button disabled={busy} onClick={()=>run(async()=>{await signOut(auth);setUser(null);setPassword('');})}>更換帳號</button></div></>:<>
 <div className="login-tabs" role="group" aria-label="登入操作">{[['login','登入'],['register','建立帳號'],['reset','忘記密碼']].map(([id,label])=><button key={id} className={mode===id?'selected':''} aria-pressed={mode===id} disabled={busy} onClick={()=>{setMode(id as typeof mode);setError('');setNotice('');setPassword('');setConfirm('');}}>{label}</button>)}</div>
 <h2>{mode==='login'?'歡迎回到專案工作區':mode==='register'?'建立工程師帳號':'重設登入密碼'}</h2>
 {mode!=='reset'&&<><button className="google-login" disabled={busy} onClick={()=>run(async()=>{const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});finish((await signInWithPopup(auth,provider)).user);})}><span aria-hidden="true">G</span>使用Google帳號繼續</button><div className="login-divider">或使用信箱</div></>}
 <form onSubmit={e=>{e.preventDefault();run(submit);}}><label>電子郵件信箱<input type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)}/></label>
 {mode!=='reset'&&<><label>密碼<input type={visible?'text':'password'} autoComplete={mode==='register'?'new-password':'current-password'} required minLength={mode==='register'?12:undefined} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>{mode==='register'&&<><p className="muted">至少12個字元，請避免重複使用其他網站的密碼。</p><label>再次輸入密碼<input type={visible?'text':'password'} autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label></>}<label className="checkbox"><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/>顯示密碼</label></>}
 <button className="primary" disabled={busy}>{busy?'處理中…':mode==='login'?'登入工作區':mode==='register'?'建立帳號並驗證信箱':'寄送重設密碼通知'}<LogIn size={18}/></button></form><p className="muted">{mode==='register'?'建立帳號及驗證信箱，不代表已取得專案權限。':'共用電腦使用完畢後，請登出並關閉瀏覽器。'}</p></>}
 {error&&<p className="login-message error" role="alert">{error}</p>}{notice&&<p className="login-message" role="status">{notice}</p>}
 </section></main><footer className="login-footer"><span>宗亞資訊 · 授權成員專用</span><button className="text-button" disabled={busy} onClick={()=>run(administratorSignIn)}>管理者入口（ChatGPT）</button></footer></div>;
}
