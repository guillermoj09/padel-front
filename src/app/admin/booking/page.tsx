"use client";

import ProtectedShell from "@/features/auth/ProtectedShell";
import CanchaCalendarPanel from "@/features/court/components/CanchaCalendarPanel";

export default function AdminReservasPage() {
  return (
    <ProtectedShell>
      <main className="h-screen bg-zinc-50">
        <div className="flex h-full flex-col">
          <header className="border-b border-zinc-200 bg-white px-4 py-3">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Reservas</h1>
              <p className="text-xs text-zinc-500">
                Gestión de reservas por calendario o listado.
              </p>
            </div>
          </header>

          <section className="flex-1 overflow-hidden p-4">
            <CanchaCalendarPanel dataSource="api" />
          </section>
        </div>
      </main>
    </ProtectedShell>
  );
}
