# Story Platform (React + Vite)

協作寫故事的前端專案，提供分支/讚、AI 靈感、AI 封面、朗讀、Google 登入等功能。

## 快速開始
1) 安裝依賴：`npm install`
2) 設定 `.env`（範例見下），再重新啟動 `npm run dev`
3) 開發：`npm run dev`
4) 打包：`npm run build`

### `.env` 範例
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...

VITE_GEMINI_API_KEY=your_gemini_key
```

## 主要功能
- 故事串流：分支瀏覽、按讚、AI 排名、音訊朗讀
- AI 支援：靈感產生、分支建議、AI 封面生成
- 協作：邀請連結 (storyId) 一鍵複製、匯出文字、社群分享
- 安全：Google 登入同步身份，匿名模式可快速體驗

## 開發提示
- 若 AI 功能失效，先確認 `VITE_GEMINI_API_KEY`、已啟用 Gemini/Vertex AI API，並重啟 dev server。
- 若 Google 登入失敗，檢查 Firebase authDomain、Authorized domains、以及 Firestore/Rules 是否允許所需操作。
