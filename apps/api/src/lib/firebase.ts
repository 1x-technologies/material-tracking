import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || undefined;

const app =
  getApps().length === 0
    ? initializeApp({
        projectId,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.firebasestorage.app` : undefined),
      })
    : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

let secretClient: SecretManagerServiceClient | null = null;

function getSecretClient(): SecretManagerServiceClient {
  if (!secretClient) {
    secretClient = new SecretManagerServiceClient();
  }
  return secretClient;
}

export async function getSecret(secretName: string): Promise<string> {
  const pid = process.env.GCLOUD_PROJECT ?? process.env.FIREBASE_PROJECT_ID;
  const [version] = await getSecretClient().accessSecretVersion({
    name: `projects/${pid}/secrets/${secretName}/versions/latest`,
  });
  return version.payload?.data?.toString() ?? "";
}
