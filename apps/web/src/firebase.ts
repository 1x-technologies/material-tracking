import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config is loaded from environment variables so that dev, staging,
// and prod deployments each point at their own Firebase project.  The fallback
// values keep local development working without a .env file.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "manufacturing-472518.firebaseapp.com",
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || "manufacturing-472518",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "manufacturing-472518.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "183048712359",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID || "1:183048712359:web:a6ec0b9550aa7b9d55eb82",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export const firebaseStorage = getStorage(app);
export { app };
