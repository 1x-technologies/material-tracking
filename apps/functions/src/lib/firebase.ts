import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const app = getApps().length === 0 ? initializeApp() : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Lazy-initialized to avoid cold start overhead when secrets are not needed
let secretClient: SecretManagerServiceClient | null = null;

function getSecretClient(): SecretManagerServiceClient {
  if (!secretClient) {
    secretClient = new SecretManagerServiceClient();
  }
  return secretClient;
}

export async function getSecret(secretName: string): Promise<string> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCLOUD_PROJECT;
  const [version] = await getSecretClient().accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
  });
  return version.payload?.data?.toString() ?? "";
}
