"use client";

import ProtectedShell from "@/features/auth/ProtectedShell";
import CanchaCalendarPanel from "@/features/court/components/CanchaCalendarPanel";

export default function CanchasPage() {
  return (
    <ProtectedShell>
      <main className="h-full min-h-0 overflow-hidden bg-zinc-50 p-2">
        <CanchaCalendarPanel dataSource="api" />
      </main>
    </ProtectedShell>
  );
}
