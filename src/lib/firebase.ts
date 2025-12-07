import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // [1] 新增引入

const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && typeof (window as any).__firebase_config !== 'undefined') {
    try {
      return JSON.parse((window as any).__firebase_config);
    } catch (e) {
      console.warn("Failed to parse __firebase_config, falling back to env config.");
    }
  }

  const env = import.meta.env;
  return {
    apiKey: env.VITE_FIREBASE_API_KEY || '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: env.VITE_FIREBASE_APP_ID || '',
    measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || '',
  };
};

const firebaseConfig = getFirebaseConfig();

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
requiredKeys.forEach((key) => {
  if (!(firebaseConfig as any)[key]) {
    console.warn(`[firebase] Missing required config: ${key}. Please set it in .env (prefixed with VITE_).`);
  }
});

// Initialize once
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); // [2] 初始化 storage

const APP_ID = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'story-platform-default';

// [3] 記得在 export 列表中加入 storage
export { app, auth, db, storage, APP_ID, firebaseConfig };