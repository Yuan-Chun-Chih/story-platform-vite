import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * 壓縮圖片尺寸，將寬度限制在 maxWidth 以內 (預設 600px)，並回傳 Base64 字串
 * @param base64Str 原始圖片 Base64
 * @param maxWidth 最大寬度
 */
export const resizeImage = (base64Str: string, maxWidth = 600): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      // 計算等比例縮放後的尺寸
      if (width > maxWidth) {
        height *= maxWidth / width;
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // 轉出壓縮後的 JPEG (品質 0.85)
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        // 如果 Canvas 失敗，回傳原圖
        resolve(base64Str);
      }
    };
    img.onerror = () => resolve(base64Str); // 載入失敗回傳原字串，避免程式崩潰
  });
};

/**
 * 將 Base64 圖片上傳至 Firebase Storage 並取得公開下載連結
 * @param base64Str 圖片的 Base64 字串 (需包含 data:image/... 前綴)
 * @param path Storage 中的資料夾路徑，例如 'covers/userId'
 * @returns 圖片的公開下載網址 (Download URL)
 */
export const uploadBase64Image = async (base64Str: string, path: string): Promise<string | null> => {
  try {
    // 建立唯一的檔案名稱：時間戳記 + 隨機數
    const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
    const fullPath = `${path}/${filename}`;
    
    // 建立 Storage 參照
    const storageRef = ref(storage, fullPath);

    // 上傳字串 (使用 'data_url' 格式，因為傳入的 resizeImage 結果包含前綴)
    await uploadString(storageRef, base64Str, 'data_url');

    // 取得並回傳公開下載連結
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
};