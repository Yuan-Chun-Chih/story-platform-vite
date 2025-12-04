# 專案概覽

## 前端技術
- React + TypeScript + Vite：快速開發與 HMR。
- Tailwind v4：原子化樣式，搭配自訂玻璃感、漸層背景。
- React Lazy + Suspense：分頁 (Home/Story) 分片載入，降低首包體積。
- UI 元件：自製 GlassCard、Aurora 背景，Lucide icon（可再做按需載入）。

## 後端 / API 串接
- Firebase Authentication：匿名登入 + Google OAuth，使用者同步暱稱/頭像。
- Firestore：儲存故事、分支、按讚資料；使用 `onSnapshot` 即時更新。
- Gemini (Vertex AI/Generative Language)：
  - Text：靈感產生、分支排名。
  - Image：AI 封面生成。
  - TTS：段落語音播放，前端將 PCM 轉 WAV 播放。
- 連結分享：邀請連結帶 `storyId` 查詢參數，開啟即定位到指定故事。

## 服務對象與能解決的問題
- 對象：喜歡協作寫作、世界觀共創的使用者；教育/社群活動需要共同編寫故事的團隊。
- 問題解決：
  - 寫作卡關：AI 靈感/排名提供延伸方向與品質指引。
  - 協作散亂：分支化呈現 + 即時更新，降低版本衝突。
  - 參與門檻：匿名即可體驗；Google 登入可保留身份與作品。
  - 敘事沉浸：AI 朗讀、AI 封面讓文本更具氛圍。

## 安全與部署提醒
- `.env` 需設定 Firebase 與 `VITE_GEMINI_API_KEY`；更新後重啟 dev server。
- Firebase Authorized Domains 要包含部署網域；Firestore 規則限制未授權寫入。
- Gemini/Vertex AI 需啟用對應 API 並開啟 Billing；注意前端暴露的 API Key 權限限制（建議限制網域）。
