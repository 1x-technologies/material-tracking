import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";
import type { UserRole } from "@material-tracking/shared";
import { firebaseAuth, firestore } from "../firebase";

export interface AppUser {
  role: UserRole;
  displayName: string;
  email: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setProfileLoading(true);
        setProfileError(null);
        setLoading(false);

        getDoc(doc(firestore, "users", firebaseUser.uid))
          .then((userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data();
              setAppUser({
                role: data.role as UserRole,
                displayName: data.displayName || firebaseUser.displayName || "",
                email: data.email || firebaseUser.email || "",
              });
            } else {
              setAppUser(null);
            }
          })
          .catch((err) => {
            setProfileError(
              err instanceof Error ? err : new Error("Failed to load user profile"),
            );
            setAppUser(null);
          })
          .finally(() => {
            setProfileLoading(false);
          });
      } else {
        setAppUser(null);
        setProfileLoading(false);
        setProfileError(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

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
