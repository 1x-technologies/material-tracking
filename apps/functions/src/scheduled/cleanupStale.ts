import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * Placeholder for future stale data cleanup logic.
 * Currently a no-op -- the schedule is kept registered so deployment
 * infrastructure stays consistent and the function can be implemented
 * without redeploying the trigger configuration.
 *
 * TODO: Implement cleanup of orphaned pieces, expired temp uploads, etc.
 * Consider disabling the schedule in firebase.json if this remains unused
 * to avoid unnecessary invocations.
 */
export const cleanupStaleData = onSchedule(
  {
    schedule: "every 24 hours",
    timeZone: "America/Chicago",
    region: "us-central1",
  },
  async () => {
    try {
      console.log("Running scheduled cleanup task (no-op placeholder)");
    } catch (error) {
      console.error("cleanupStaleData error:", error);
    }
  },
);
