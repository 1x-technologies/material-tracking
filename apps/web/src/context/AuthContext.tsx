import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from "react";
import type { UserRole } from "@material-tracking/shared";
import { firebaseAuth, firestore } from "../firebase";

export interface AppUser {
  role: UserRole | null;
  displayName: string;
  email: string;
  locationId: string;
}

export interface AuthContextValue {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  profileLoading: boolean;
  profileError: Error | null;
  signIn: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ hd: "1x.tech" });

export const GOOGLE_HD_PARAM = "1x.tech";

async function ensureProfileViaApi(idToken: string): Promise<void> {
  const apiUrl = import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/trpc/user.me`
    : "/api/trpc/user.me";

  // 10-second timeout prevents the UI from hanging indefinitely when the API
  // is slow or unreachable (e.g. cold-start, network issues).
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(apiUrl, {
      headers: { authorization: `Bearer ${idToken}` },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[ensureProfileViaApi] HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      console.error("[ensureProfileViaApi] Request timed out after 10 seconds");
    } else {
      console.error("[ensureProfileViaApi] Fetch failed:", err);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);

  const loadProfile = useCallback(async (firebaseUser: User) => {
    setProfileLoading(true);
    setProfileError(null);

    try {
      let userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));

      if (!userDoc.exists()) {
        const idToken = await firebaseUser.getIdToken();
        await ensureProfileViaApi(idToken);
        userDoc = await getDoc(doc(firestore, "users", firebaseUser.uid));
      }

      if (userDoc.exists()) {
        const data = userDoc.data();
        setAppUser({
          role: (data.role as UserRole) ?? null,
          displayName: data.displayName || firebaseUser.displayName || "",
          email: data.email || firebaseUser.email || "",
          locationId: (data.locationId as string) ?? "",
        });
      } else {
        setAppUser(null);
      }
    } catch (err) {
      setProfileError(
        err instanceof Error ? err : new Error("Failed to load user profile"),
      );
      setAppUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        loadProfile(firebaseUser);
      } else {
        setAppUser(null);
        setProfileLoading(false);
        setProfileError(null);
      }
    });
    return unsubscribe;
  }, [loadProfile]);

  const signIn = async () => {
    await signInWithPopup(firebaseAuth, googleProvider);
  };

  const signOutUser = async () => {
    await signOut(firebaseAuth);
  };

  return (
    <AuthContext.Provider
      value={{ user, appUser, loading, profileLoading, profileError, signIn, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
