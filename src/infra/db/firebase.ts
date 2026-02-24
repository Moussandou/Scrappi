import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const isConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

if (!isConfigValid && typeof window !== 'undefined') {
    console.warn("⚠️ Firebase configuration is missing or incomplete:", {
        hasApiKey: !!firebaseConfig.apiKey,
        hasProjectId: !!firebaseConfig.projectId,
        hasAppId: !!firebaseConfig.appId,
        env: process.env.NODE_ENV
    });
}

const app = (!getApps().length && isConfigValid)
    ? initializeApp(firebaseConfig)
    : (getApps().length > 0 ? getApp() : null);

const db = (app ? getFirestore(app) : null) as unknown as ReturnType<typeof getFirestore>;
const storage = (app ? getStorage(app) : null) as unknown as ReturnType<typeof getStorage>;
const auth = (app ? getAuth(app) : null) as unknown as ReturnType<typeof getAuth>;

export { app, db, storage, auth };
