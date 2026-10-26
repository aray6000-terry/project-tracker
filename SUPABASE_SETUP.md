# 工程師登入：Supabase 啟用與驗收

更新：2026-10-26。狀態：Google、Email OTP、手機 OTP 程式已備妥；尚未建立或連接實際 Supabase 專案，尚未切換正式網站。

## 使用者體驗

工程師直接開啟網站，選擇 Google 帳號或接收 Email／手機驗證碼。不需要 GitHub、ChatGPT 或 Supabase 帳號，不需要安裝外掛。Supabase 管理帳戶僅由網站管理者維護。

登入頁會將尚未完成服務設定的方式標示「設定中」並停用，不把尚未設定的入口當作可用功能。工程師身分驗證完成後，仍須通過網站的核准名單與專案授權。管理者現有 ChatGPT 入口暫時保留，保護既有管理及 Drive 備份操作。

## 已完成的程式

- 固定使用指定 Supabase 專案，後端透過 `auth.getUser(token)` 向 Auth 服務驗證憑證。
- 在遠端驗證前檢查 issuer、audience、role、session_id、時效與匿名狀態；解碼本身不作為信任依據。
- 僅使用 Auth 服務回傳且已驗證的 Email／手機；不以可編輯的 user_metadata 判斷身分或權限。
- 成員首次登入綁定唯一 Supabase 使用者 ID，避免另一個帳號以相同 Email 或回收手機號碼接管權限。
- 支援管理者用 Email 或手機核准／分享；台灣 09 手機轉為 +886 格式，國際手機須有國碼。
- 既有 email 欄位保留作為不可任意變更的會員與 ACL 主鍵，可保存 Email 或 E.164 手機；追加 supabase_uid 欄位，不改寫舊遷移。
- 同一人若以多個已驗證聯絡方式對應到不同會員，拒絕自動合併，由管理者確認處理。
- 每個專案讀寫、分享、停用與備份權限仍在後端檢查；身份驗證不會自動成為管理者。
- 以獨立 X-Project-Authorization header 傳遞工程師憑證，保留平台 MCP 授權；無效外部憑證不會退回管理者身分。
- 瀏覽器使用 sessionStorage 保存本次登入；Google 採 PKCE，回呼路徑為 `/auth/complete`。
- 驗證碼支援手機數字鍵盤、貼上與自動填碼；60 秒重送倒數僅為介面控制，後端仍須設定限流。
- 登入、回呼與資料 API 設定 no-store；不輸出驗證碼、OAuth code 或登入 token。

## 必須先完成的服務設定

### 1. 專案與帳務歸屬

先由管理者選定 Supabase 組織，再建立專用專案。建議專案名稱 `zongya-project-tracker`；區域可評估東京（ap-northeast-1）。先確認組織方案與實際報價，不預設永久免費，不自行升級。

只用 Supabase Auth 作為登入服務；既有專案資料、版本及 ACL 維持網站資料庫，Drive 繼續按專案歸檔。不要把專案資料改成公開資料表或公開 Drive 連結。

### 2. 網址與公開設定

以實際正式網站 URL 設定 Supabase Site URL，redirect allowlist 僅加入正式 `/auth/complete` 路徑，不使用寬泛萬用字元。必要測試網址使用獨立測試專案或精確清單。

網站執行環境欄位：

| 欄位 | 用途 |
| --- | --- |
| SUPABASE_URL | 所選專案的 HTTPS URL |
| SUPABASE_PUBLISHABLE_KEY | 新版 sb_publishable_ 開頭的公開用戶端識別鍵 |
| AUTH_EMAIL_READY | 正式 Email 驗收完成後才設 true |
| AUTH_GOOGLE_READY | Google 授權與回呼驗收後才設 true |
| AUTH_PHONE_READY | 簡訊供應商與實際收碼驗收後才設 true |

僅接受標準 supabase.co 專案網址。本版不接受自訂驗證網域或舊版 anon JWT key；不要把 service_role／sb_secret key 填入公開設定。公開鍵不能取代 API 授權。

### 3. Email 驗證碼

1. 設定正式 SMTP 寄信服務與驗證過的寄件網域。Supabase 內建測試郵件服務只適用有限收件對象與測試用途。
2. 在 Email 範本將 Magic Link 內容改為顯示 `{{ .Token }}`，確保收到數字驗證碼。新帳號確認信也需涵蓋相同登入流程；以新舊帳號分別測試。
3. 設定 OTP 時效、請求與驗證限流，完成實際寄達測試後才開啟 AUTH_EMAIL_READY。
4. 本版 `shouldCreateUser:true` 允許新使用者建立驗證服務身分，但網站未核准者沒有任何專案權限。若改成邀請制，必須先補上管理者建立 Auth 使用者的流程，不能只把此值改 false。

### 4. Google 登入

不使用 Firebase 仍需要 Google OAuth 設定。可評估公司可使用的既有 Google Cloud 專案，新增專用 OAuth 用戶端，避免為登入另建專案撞到配額限制。不得任意改動其他系統的既有憑證。

設定 Google 應用程式品牌、使用對象與正確 callback，僅請求 openid、基本個人檔案、Email；OAuth secret 放在 Supabase 後台。檢查測試／正式發布狀態與實際可登入帳號，再開啟 AUTH_GOOGLE_READY。

### 5. 手機簡訊

選擇支援使用地區的 SMS 供應商並確認費率。設定供應商憑證、發送限制、驗證碼時效、濫用監控與費用告警／限制，實際測試至少一支使用中的手機後才開啟 AUTH_PHONE_READY。不得用公開測試號碼或固定驗證碼作為正式登入。

如啟用 Supabase CAPTCHA，須再把前端 CAPTCHA 挑戰與 captchaToken 傳遞接上，目前沒有該元件，不能只在後台開啟而宣稱網頁已相容。正式開放前要完成此項或明確評估適用的服務端濫用防護。

## 上線與安全驗收

- [ ] 專案歸屬、方案與費用完成確認。
- [ ] Supabase 專案可用、公開 URL／publishable key 已安全寫入執行環境。
- [ ] Google、Email、手機各自完成供應商設定與真實登入測試。
- [ ] 登入回呼與 OAuth 拒絕／取消操作可回到正確頁面。
- [ ] 新使用者、既有使用者、錯碼、過期碼、重複使用與重送均已測試。
- [ ] 未核准者無法取得資料；核准後仍須指派專案。
- [ ] 管理者、負責人、編輯者、唯讀者及停用人員的跨專案測試通過。
- [ ] Google 與 Email 共用同一身分的情形已測試；手機與 Email 不會錯誤合併成別人的權限。
- [ ] 管理者現有入口與 MCP 備份仍正常，既有專案資料與權限完整保留。
- [ ] 真實手機測試鍵盤、填碼、登入跳轉與登出。
- [ ] 完成供應商設定後執行 Supabase 安全檢查；若新增暴露的資料表，必須另行設計 RLS。
- [ ] 套用追加的 D1 0003 遷移並部署已驗證版本，再對外通知工程師使用。

## 已執行的驗證與界線

- TypeScript 型別檢查通過。
- 36 項真實 SQLite 權限／交易測試通過，身份來源以測試替身提供。
- 29 項登入檢查通過，包含真實 Supabase SDK 對模擬 Auth API 的請求、錯誤回應、匿名拒絕、憑證優先序與秘密鍵防外洩。
- 舊公開整批 API 拒絕讀寫測試通過。
- 瀏覽器以 320／390px iframe 檢查未設定登入頁，scrollWidth 與 clientWidth 相同，沒有橫向溢出；按鈕至少 44px 高。
- 截圖服務兩次逾時；本次未完成畫面截圖的視覺驗收。
- 尚未進行真實 Google OAuth、Email 或簡訊登入測試；模擬測試不代表供應商已啟用。
- 未實作每次請求比對 auth.sessions 的嚴格工作階段撤銷保證。緊急停權先在網站停用會員，後續請求立即拒絕；不要只刪除 Auth 帳號或假設所有已發 token 立刻失效。
- 瀏覽器 sessionStorage 仍可被同源惡意程式讀取，需保持依賴更新、避免注入與不可信腳本。這不是滲透測試或完全資安保證。

## 參考

- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://supabase.com/docs/guides/auth/auth-smtp
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/phone-login
- https://supabase.com/docs/reference/javascript/auth-getuser
- https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession

Firebase 草稿已退役，舊 migration 保留為歷史，不再使用其 SDK 或登入驗證流程。正式網站在服務設定與真實驗收完成前維持既有版本。
