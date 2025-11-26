'use client';
import { createContext, useContext, useMemo } from 'react';
import type { CurrentUser } from '@/app/(auth)/server/session';

const Ctx = createContext<CurrentUser | null>(null);

export function UserProvider({ user, children }: { user: CurrentUser | null; children: React.ReactNode }) {
  const value = useMemo(() => user, [user?.sub, user?.email, user?.name, JSON.stringify(user?.roles ?? [])]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export function useUser() { return useContext(Ctx); }
