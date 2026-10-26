'use client';
import {useEffect,useState} from 'react';
import {clientAuth} from '../../auth-client';
let completion:Promise<void>|undefined;
function complete(){return completion??=(async()=>{
 const params=new URLSearchParams(window.location.search),code=params.get('code'),flowId=params.get('sb_flow_id');
 window.history.replaceState(null,'','/auth/complete');
 if(params.has('error')||!code)throw new Error('登入未完成或已取消，請回登入頁重新操作。');
 const client=await clientAuth();if(!client)throw new Error('登入服務尚未啟用。');
 const {data,error}=await client.auth.exchangeCodeForSession(code,flowId?{flowId}:undefined);
 if(error||!data.session)throw new Error('登入驗證已過期，請在原本的瀏覽器重新登入。');
 window.location.replace('/');
})();}
export default function Complete(){const [error,setError]=useState('');useEffect(()=>{complete().catch(e=>setError((e as Error).message));},[]);return <main className="login-shell"><section className="panel login-card callback-card"><h1>{error?'登入尚未完成':'正在確認登入…'}</h1><p role={error?'alert':'status'}>{error||'請稍候，完成後將返回專案工作區。'}</p>{error&&<a className="button primary" href="/login">返回登入頁</a>}</section></main>;}
