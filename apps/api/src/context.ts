import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import type { UserRole } from '@material-tracking/shared';
import { auth } from './lib/firebase';

export interface AuthUser {
  uid: string;
  email: string | undefined;
  role: UserRole;
  name: string | undefined;
}

export interface Context {
  user: AuthUser | null;
}

export async function createContext({ req }: CreateExpressContextOptions): Promise<Context> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return { user: null };

  try {
    const decoded = await auth.verifyIdToken(token);
    return {
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: (decoded.role as UserRole) ?? 'staff',
        name: decoded.name,
      },
    };
  } catch {
    return { user: null };
  }
}
