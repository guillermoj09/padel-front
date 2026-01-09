'use client';

import { createContext, useContext } from 'react';
import { useSession } from '@/features/auth/hooks/useSession';

// El contexto solo guarda EL USUARIO, no un objeto grande
const UserContext = createContext<any>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
    console.log("UserProvider → user:", user); // 👈 agregar aquí
  return (
    <UserContext.Provider value={user}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
