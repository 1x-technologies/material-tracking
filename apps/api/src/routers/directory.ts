import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { staffProcedure } from "../middleware/auth";
import { router } from "../trpc";

const STUB_USERS = [
  { uid: "stub-user-1", name: "Ada Lovelace", email: "ada@1x.tech", department: "Engineering" },
  { uid: "stub-user-2", name: "Grace Hopper", email: "grace@1x.tech", department: "Engineering" },
  { uid: "stub-user-3", name: "Alan Turing", email: "alan@1x.tech", department: "Research" },
];

export const directoryRouter = router({
  search: staffProcedure
    .input(z.object({ query: z.string().min(1).max(200) }))
    .query(({ input }) => {
      if (process.env.DIRECTORY_STUB === "1") {
        const q = input.query.toLowerCase();
        return STUB_USERS.filter(
          (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
        );
      }

      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "DIRECTORY_NOT_CONFIGURED: Set DIRECTORY_STUB=1 for dev or configure Directory API credentials",
      });
    }),
});
