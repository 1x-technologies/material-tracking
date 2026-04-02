import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { sendNotificationEmail } from "../lib/email";
import { buildAgedReminderEmail, shipmentDetailUrl } from "../lib/emailTemplates";
import { db } from "../lib/firebase";

export const checkAgedShipments = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "America/Chicago",
    region: "us-central1",
  },
  async () => {
    // Read configurable threshold from settings/global
    const settingsSnap = await db.doc("settings/global").get();
    const agedThresholdHours: number = settingsSnap.exists
      ? ((settingsSnap.data()?.agedThresholdHours as number) ?? 24)
      : 24;

    const agedCutoff = new Date(Date.now() - agedThresholdHours * 60 * 60 * 1000);

    const agedSnap = await db
      .collection("shipments")
      .where("status", "==", "delivered")
      .where("deliveredAt", "<=", Timestamp.fromDate(agedCutoff))
      .get();

    let sent = 0;
    let skippedThrottle = 0;
    let skippedNoEmail = 0;

    for (const doc of agedSnap.docs) {
      const data = doc.data();
      const shipmentNumber: string = data.shipmentNumber;

      const lastReminder = data.lastAgedReminderAt as Timestamp | undefined;
      if (lastReminder && Date.now() - lastReminder.toMillis() < 24 * 60 * 60 * 1000) {
        skippedThrottle++;
        continue;
      }

      const receiverEmail: string | undefined = data.receiver?.email;
      if (!receiverEmail) {
        console.log(`Skipping aged reminder for ${shipmentNumber} — no receiver email`);
        skippedNoEmail++;
        continue;
      }

      const deliveredAt = data.deliveredAt as Timestamp;
      const hoursAged = Math.floor((Date.now() - deliveredAt.toMillis()) / (1000 * 60 * 60));

      const emailContent = buildAgedReminderEmail({
        shipmentNumber,
        status: data.status,
        pieceCount: data.pieceCount,
        senderName: data.sender.name,
        receiverName: data.receiver.name,
        detailUrl: shipmentDetailUrl(doc.id),
        hoursAged,
      });

      await sendNotificationEmail({
        to: receiverEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      await doc.ref.update({
        lastAgedReminderAt: FieldValue.serverTimestamp(),
      });

      sent++;
    }

    console.log(
      `Aged report: ${agedSnap.size} found, ${sent} reminders sent, ${skippedThrottle} throttled, ${skippedNoEmail} no email`,
    );
  },
);
