import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'宗亞工程師培訓｜進度管理',description:'24週養成、完整指導清冊、工程關卡與能力考核。',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="zh-Hant"><body>{children}</body></html>;}
