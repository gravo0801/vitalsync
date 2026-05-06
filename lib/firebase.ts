import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
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

export const db = getFirestore(app);
export const storage = getStorage(app);
export const PERSONAL_USER_ID = "personal-user";
