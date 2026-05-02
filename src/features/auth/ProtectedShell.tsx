"use client";

import type { ReactNode } from "react";
import { UserProvider } from "@/features/auth/UserProvider";
import TopBar from "@/features/court/components/TopBar";

export default function ProtectedShell({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-zinc-50">
        <TopBar />
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </UserProvider>
  );
}
