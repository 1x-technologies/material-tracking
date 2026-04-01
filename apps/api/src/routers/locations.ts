import { protectedProcedure } from "../middleware/auth";
import { db } from "../lib/firebase";
import { router } from "../trpc";

export const locationsRouter = router({
  list: protectedProcedure.query(async () => {
    const snap = await db.collection("locations").where("active", "==", true).get();

    return snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name as string,
        fullName: data.fullName as string,
        address: data.address as string,
        active: data.active as boolean,
        printers: (data.printers ?? []) as Array<{
          name: string;
          ip: string;
          model: string;
          isDefault: boolean;
        }>,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });
  }),
});
