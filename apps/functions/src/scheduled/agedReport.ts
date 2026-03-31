import { Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { db } from "../lib/firebase";

export const checkAgedShipments = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "America/Chicago",
    region: "us-central1",
  },
  async () => {
    const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const agedPieces = await db
      .collectionGroup("pieces")
      .where("status", "==", "delivered")
      .where("deliveredAt", "<=", Timestamp.fromDate(threshold))
      .get();

    console.log(`Found ${agedPieces.size} aged pieces for notification`);
  },
);
