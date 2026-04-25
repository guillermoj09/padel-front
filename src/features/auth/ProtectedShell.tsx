"use client";

import type { ReactNode } from "react";
import { UserProvider } from "@/features/auth/UserProvider";
import TopBar from "@/features/court/components/TopBar";

export default function ProtectedShell({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <TopBar />
      {children}
    </UserProvider>
  );
}
