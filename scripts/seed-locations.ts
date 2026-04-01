/**
 * Seed Firestore with HA and SC location documents.
 *
 * Prerequisites:
 *   - `gcloud auth application-default login` or set GOOGLE_APPLICATION_CREDENTIALS
 *   - GCLOUD_PROJECT env var (or default Firebase project configured)
 *
 * Usage:
 *   pnpm seed:locations
 */
import { getApps, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const app = getApps().length === 0 ? initializeApp() : getApps()[0];
const db = getFirestore(app);

const locations = [
  {
    id: "HA",
    name: "HA",
    fullName: "Hayward",
    address: "Hayward, CA",
    active: true,
    printers: [],
  },
  {
    id: "SC",
    name: "SC",
    fullName: "San Carlos",
    address: "San Carlos, CA",
    active: true,
    printers: [],
  },
];

async function seed() {
  for (const loc of locations) {
    const { id, ...data } = loc;
    await db.doc(`locations/${id}`).set(
      { ...data, createdAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
    console.log(`Upserted locations/${id} (${loc.fullName})`);
  }
  console.log("Seed complete.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
