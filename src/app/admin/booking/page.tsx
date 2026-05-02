"use client";

import ProtectedShell from "@/features/auth/ProtectedShell";
import CanchaCalendarPanel from "@/features/court/components/CanchaCalendarPanel";

export default function AdminReservasPage() {
  return (
    <ProtectedShell>
      <main className="h-full min-h-0 overflow-hidden bg-zinc-50">
        <div className="flex h-full min-h-0 flex-col">
          <header className="shrink-0 border-b border-zinc-200 bg-white px-3 py-2">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Reservas</h1>
              <p className="text-xs text-zinc-500">
                Gestión de reservas por calendario o listado.
              </p>
            </div>
          </header>

          <section className="min-h-0 flex-1 overflow-hidden p-2">
            <CanchaCalendarPanel dataSource="api" />
          </section>
        </div>
      </main>
    </ProtectedShell>
  );
}
