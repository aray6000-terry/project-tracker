# 工程師免 ChatGPT 登入：Firebase 啟用清單

更新：2026-10-25。狀態：程式與本機安全檢查完成；Firebase 專案尚未連接，正式網站尚未切換。

## Firebase 的用途

這次只使用 Firebase Authentication 處理工程師帳號：Google 登入、信箱密碼、信箱驗證及密碼重設。工程師不需要 ChatGPT 帳號，也不需要安裝 ChatGPT 的 Firebase 外掛；外掛只協助網站管理者設定服務。

網站繼續保存專案與授權紀錄，Google Drive 繼續作為指定的文件與專案備份目的地。Firebase 登入不會自動把既有專案或 Drive 文件搬到 Firebase。網站不保存工程師密碼。

啟用後：開啟網站 → Google 或信箱登入 → 信箱驗證 → 管理者核准 → 取得個別專案權限。自行註冊不會取得任何公司專案。管理者目前保留原有 ChatGPT 管理入口；工程師使用獨立的 `/login`。

## 管理者與工程師的分工

| 項目 | 負責者 |
| --- | --- |
| 建立、連接 Firebase 專案及服務設定 | 網站管理者 |
| Google 帳號或信箱密碼登入 | 工程師本人 |
| 驗證信、重設密碼 | Firebase Authentication |
| 核准成員、停用帳號、允許建立與分享 | 網站管理者 |
| 指派專案、唯讀或編輯權限 | 管理者或已獲允許分享的專案負責人 |
| 專案文件及備份 | 現有網站與指定 Drive 資料夾 |

## 啟用前必做

1. 管理者安裝並連接 Firebase 整合；選擇自己或公司擁有的 Firebase 專案。安裝外掛本身不等於 Firebase 專案及登入功能已啟用。
2. 在 Firebase 專案註冊 Web app，啟用 Authentication 的 Google 與 Email/Password 兩種方式。Google 的支援信箱使用管理者已驗證的信箱。
3. 授權網域加入正式網站主機名稱。驗證信及密碼重設回到正式網站的 `/login`；不得加入不受控網域。
4. 在 Firebase 後端強制密碼政策至少 12 字元；網頁的長度提示不是後端安全限制。啟用 email enumeration protection，確認驗證信、重設信與濫用防護設定。
5. 將 Web app 的以下四個值填入網站執行環境：`FIREBASE_PROJECT_ID`、`FIREBASE_WEB_API_KEY`、`FIREBASE_AUTH_DOMAIN`、`FIREBASE_APP_ID`。本版使用預設 `PROJECT_ID.firebaseapp.com` 登入網域。
6. Web 設定會提供給瀏覽器；Firebase Web API key 是專案識別設定，不是管理者私鑰。不要將服務帳號金鑰、OAuth client secret 或管理者密碼放進網站、GitHub 或對話。
7. 檢查 Web key 的 API／網站限制與 Firebase Authentication 相容，再以實際登入測試確認。設定不能只靠隱藏 Web key 代替授權。
8. 套用追加的 `0002` 資料庫遷移，新增成員 Firebase UID 綁定欄位；不刪除或重寫既有 migration。
9. 完成下方真實帳號驗收後才發布。保留前一個已部署版本供回復；新增欄位不影響舊版本讀取。

不在這次設定中開啟收費升級、簡訊登入、Firestore 或 Firebase Storage。若後續需要付費功能，先確認方案與用途；不保證所有使用量永久免費。

## 必須以真實服務完成的驗收

- [ ] 未登入可看公開介紹，但不能讀取專案 API。
- [ ] 沒有 ChatGPT 帳號的工程師可用 Google 登入。
- [ ] 新信箱帳號可註冊、收到驗證信；未驗證不得存取專案。
- [ ] 忘記密碼可完成重設；錯誤密碼及過量嘗試得到合理提示。
- [ ] 已驗證但未核准的帳號只能看到等待核准。
- [ ] 管理者核准並指派後，只看到被授權的專案。
- [ ] 唯讀成員不能寫入；編輯者不能自行增加管理權限。
- [ ] 移除專案授權、停用成員後，下一次 API 請求即被拒絕。
- [ ] 工程師登出後原頁面不能繼續讀取；共用裝置切換帳號無權限混用。
- [ ] 管理者的原有登入、成員管理及 MCP 備份通道正常。
- [ ] 320／390／768px 畫面可完成登入操作；實機 iOS Safari 與 Android Chrome 測試 Google 彈出登入視窗，阻擋時顯示提示並可改用信箱登入。

上述項目目前尚未以連接的 Firebase 專案完成，不應把程式測試視為正式登入已成功。

## 已實作的安全界線

- 伺服器使用 Firebase 官方固定憑證來源，檢查 RS256 簽章、專案 audience、issuer、有效時間、UID、已驗證信箱及登入來源。
- 工程師憑證使用獨立的 `X-Project-Authorization` 標頭；不干擾原有平台的 MCP Authorization。憑證無效時拒絕，不會改用同瀏覽器的管理者身分。
- 核准信箱在首次成功登入時綁定 Firebase UID。另一個 UID 即使使用同信箱，也不能接管已綁定帳號；需要人工確認後處理帳號遷移。
- Firebase 帳號不能因為與管理者信箱相同而成為管理者；管理入口仍要求原有可信任的平台身分。
- 每次專案 API 都重查成員與專案權限，保留來源檢查、輸入驗證、版本衝突防護及操作紀錄。
- 瀏覽器憑證只傳給同網域的 `/api/`，使用分頁工作階段保存登入；不將專案內容當作登入狀態保存。
- 本版沒有 Firebase Admin 的即時撤銷查詢。只在 Firebase 控制台停用或撤銷，已發出的 ID token 仍可能在到期前有效，通常最長約一小時。緊急停權必須同時在網站停用成員；網站會員檢查會在下一次請求拒絕。
- 未連接或設定不完整時，登入頁明確顯示「尚未啟用」，不產生假帳號或開放測試繞過入口。

## 已完成的開發檢查

- TypeScript 型別檢查通過。
- 31 項真實 RSA 簽章與身分分流測試通過：含錯誤簽章、過期、錯誤專案、未驗證信箱、演算法替換、無效憑證不得退回管理者身分。
- 31 項 SQLite 權限與資料安全測試通過：含跨專案存取、分享升權、帳號停用、UID 接管、交易回滾、備份權限。
- 已停用的舊公開大量讀寫入口回歸檢查通過。
- 本機瀏覽器確認未設定服務時顯示明確提示。實際 OAuth、郵件送達與手機登入仍待服務連接後驗收。

## 官方參考

- [Firebase Authentication：Google 登入](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Authentication：信箱密碼與密碼政策](https://firebase.google.com/docs/auth/web/password-auth)
- [伺服器驗證 Firebase ID token](https://firebase.google.com/docs/auth/admin/verify-id-tokens)

以上描述是本次改版的實際範圍；Firebase 尚未連接時，正式網站維持原版本。先前登入步驟文件仍描述舊版，啟用後再以本文件流程取代。
