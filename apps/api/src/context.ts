import { firestoreUserProfileSchema } from "@material-tracking/shared";
import type { UserRole } from "@material-tracking/shared";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { FieldValue } from "firebase-admin/firestore";
import { auth, db } from "./lib/firebase";

export interface AuthUser {
  uid: string;
  email: string | undefined;
  role: UserRole | null;
  name: string | undefined;
  locationId: string;
}

export interface Context {
  user: AuthUser | null;
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return { user: null };

  try {
    const decoded = await auth.verifyIdToken(token);
    const userRef = db.collection("users").doc(decoded.uid);
    let snap = await userRef.get();

    if (!snap.exists) {
      try {
        await userRef.create({
          role: null,
          email: decoded.email ?? "",
          displayName: decoded.name ?? "",
          department: "",
          locationId: "",
          fcmTokens: [],
          notificationPrefs: { onDelivery: true, onPickup: true, onTransit: false },
          createdAt: FieldValue.serverTimestamp(),
          lastLoginAt: FieldValue.serverTimestamp(),
        });
      } catch (err: unknown) {
        if ((err as { code?: number }).code === 6) {
          // ALREADY_EXISTS — another writer created the doc between get and create
          // Re-fetch to get the actual data
        } else {
          throw err;
        }
      }
      snap = await userRef.get();
    }

    const parsed = firestoreUserProfileSchema.parse(snap.data());

    return {
      user: {
        uid: decoded.uid,
        email: decoded.email,
        name: parsed.displayName || decoded.name,
        role: parsed.role ?? null,
        locationId: parsed.locationId ?? "",
      },
    };
  } catch (err) {
    console.error("[auth] createContext failed:", (err as Error).message ?? err);
    return { user: null };
  }
}
