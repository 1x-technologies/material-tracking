import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const configs = {
  dev: {
    projectId: '1xtech-material-tracking-dev',
    authDomain: '1xtech-material-tracking-dev.firebaseapp.com',
    storageBucket: '1xtech-material-tracking-dev.firebasestorage.app',
  },
  staging: {
    projectId: '1xtech-material-tracking-staging',
    authDomain: '1xtech-material-tracking-staging.firebaseapp.com',
    storageBucket: '1xtech-material-tracking-staging.firebasestorage.app',
  },
  prod: {
    projectId: '1xtech-material-tracking-prod',
    authDomain: '1xtech-material-tracking-prod.firebaseapp.com',
    storageBucket: '1xtech-material-tracking-prod.firebasestorage.app',
  },
} as const;

type FirebaseEnv = keyof typeof configs;
const env = (import.meta.env.VITE_FIREBASE_ENV || 'dev') as FirebaseEnv;
const firebaseConfig = {
  ...configs[env],
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const firebaseAuth = getAuth(app);
export const firestore = getFirestore(app);
export const firebaseStorage = getStorage(app);
export { app };
