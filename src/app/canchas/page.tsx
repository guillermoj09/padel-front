"use client";

import ProtectedShell from "@/features/auth/ProtectedShell";
import CanchaCalendarPanel from "@/features/court/components/CanchaCalendarPanel";

export default function CanchasPage() {
  return (
    <ProtectedShell>
      <div className="p-4">
        <CanchaCalendarPanel dataSource="api" />
      </div>
    </ProtectedShell>
  );
}
