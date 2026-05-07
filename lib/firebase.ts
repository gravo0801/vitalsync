import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeFirestore, getFirestore, type Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBCJ8VBLzx_VmOyamqmJfI99xjVTuMlz4E",
  authDomain: "vitalsync-8c169.firebaseapp.com",
  projectId: "vitalsync-8c169",
  storageBucket: "vitalsync-8c169.firebasestorage.app",
  messagingSenderId: "845233550940",
  appId: "1:845233550940:web:3a8b7ad5c4ece10b3dd899",
  measurementId: "G-SVKZN6D9NH",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ⭐ ignoreUndefinedProperties: true
// undefined 값을 가진 필드는 자동으로 무시되어 저장됨
// (예: 식사 사진 미첨부 시 photoURL이 undefined여도 OK)
//
// initializeFirestore는 앱당 한 번만 호출 가능하므로
// hot reload/중복 호출 시 fallback으로 getFirestore 사용
let _db: Firestore;
try {
  _db = initializeFirestore(app, {
    ignoreUndefinedProperties: true,
  });
} catch {
  _db = getFirestore(app);
}

export const db = _db;
export const storage = getStorage(app);
export const PERSONAL_USER_ID = "personal-user";
