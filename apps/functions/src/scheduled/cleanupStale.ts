import { onSchedule } from "firebase-functions/v2/scheduler";

export const cleanupStaleData = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "America/Chicago",
    region: "us-central1",
  },
  async () => {
    console.log("Running scheduled cleanup task");
  },
);
