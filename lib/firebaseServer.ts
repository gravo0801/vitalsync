import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase/firestore";

import { firebaseConfig } from "@/lib/firebaseConfig";

const APP_NAME = "vitalsync-workout-api";
const serverApp = getApps().some((app) => app.name === APP_NAME)
  ? getApp(APP_NAME)
  : initializeApp(firebaseConfig, APP_NAME);

let db: Firestore;
try {
  db = initializeFirestore(serverApp, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  });
} catch {
  db = getFirestore(serverApp);
}

export const serverDb = db;
