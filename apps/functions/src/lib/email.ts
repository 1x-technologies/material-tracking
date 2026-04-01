import { FieldValue } from "firebase-admin/firestore";
import { db } from "./firebase";

interface NotificationEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendNotificationEmail({ to, subject, html }: NotificationEmailParams): Promise<void> {
  await db.collection("mail").add({
    to,
    message: { subject, html },
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log(`Queued notification email to ${to}: ${subject}`);
}
