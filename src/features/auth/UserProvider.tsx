'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useSession } from '@/features/auth/hooks/useSession';
import type { AuthUser } from '@/features/auth/types';

const UserContext = createContext<AuthUser | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { user } = useSession();

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
