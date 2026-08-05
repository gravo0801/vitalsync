import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig, PERSONAL_USER_ID } from "@/lib/firebaseConfig";

export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// undefined 값을 가진 필드는 자동으로 무시한다.
// initializeFirestore는 앱당 한 번만 호출할 수 있으므로 중복 초기화 시 fallback한다.
let _db: Firestore;
try {
  _db = initializeFirestore(firebaseApp, {
    ignoreUndefinedProperties: true,
  });
} catch {
  _db = getFirestore(firebaseApp);
}

export const db = _db;
export const storage = getStorage(firebaseApp);
export { PERSONAL_USER_ID };
