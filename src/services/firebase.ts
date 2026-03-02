import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let db: any = null;
let auth: any = null;
let isFirebaseInitialized = false;

try {
  if (
    firebaseConfig.apiKey && 
    firebaseConfig.projectId && 
    firebaseConfig.appId &&
    firebaseConfig.apiKey !== 'undefined'
  ) {
    console.log("[Firebase] Configuration found, initializing...");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isFirebaseInitialized = true;
    console.log("[Firebase] Initialized successfully.");
  } else {
    console.warn("[Firebase] Configuration incomplete or missing. Keys present:", {
      apiKey: !!firebaseConfig.apiKey,
      authDomain: !!firebaseConfig.authDomain,
      projectId: !!firebaseConfig.projectId,
      appId: !!firebaseConfig.appId
    });
    console.warn("Falling back to local mode.");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { db, auth, isFirebaseInitialized };
