// src/hooks/useTour.ts
import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export const useTour = () => {
  useEffect(() => {
    // 檢查是否已經看過導覽
    const hasSeenTour = localStorage.getItem('has_seen_tour');
    if (hasSeenTour) return;

    // 延遲執行，確保 DOM 已經渲染完畢
    const timer = setTimeout(() => {
      // 檢查 driver.js 依賴是否載入
      if (typeof driver !== 'function') {
        console.error("Driver.js library not loaded. Did you run 'npm install driver.js'?");
        return;
      }
      
      const driverObj = driver({
        showProgress: true,
        allowClose: true,
        // 定義導覽步驟 (確保以下 id 已經在 HeaderBar.tsx 和 HomeView.tsx 中設定)
        steps: [
          { 
            element: '#tour-logo', 
            popover: { 
              title: '歡迎來到 Co-Weave', 
              description: '這是一個由 AI 輔助的共同創作平台。點擊這裡隨時可以回到首頁。' 
            } 
          },
          { 
            element: '#tour-create', 
            popover: { 
              title: '開始創作', 
              description: '有了新靈感？點擊這裡開啟一個全新的故事世界。' 
            } 
          },
          { 
            element: '#tour-search', 
            popover: { 
              title: '探索故事', 
              description: '使用關鍵字或類型過濾，找到你有興趣接龍的故事。' 
            } 
          },
          { 
            element: '#tour-user', 
            popover: { 
              title: '個人帳戶', 
              description: '登入 Google 帳戶以保存您的創作紀錄，並同步您的暱稱。' 
            } 
          },
        ],
        // 導覽結束或被關閉時，設定 LocalStorage
        onDestroyStarted: () => {
           // 這是 driver.js 推薦的關閉確認方式
           if (!driverObj.hasNextStep() || confirm("確定要略過導覽嗎？")) {
             driverObj.destroy();
             localStorage.setItem('has_seen_tour', 'true');
           }
        },
      });

      driverObj.drive();
    }, 1500); 

    return () => clearTimeout(timer);
  }, []);
};