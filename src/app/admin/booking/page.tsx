// app/admin/reservas/page.tsx
'use client';

import { useState } from 'react';
import CanchaCalendarRBC from '@/features/court/components/CanchaCalendarRBC';
import { AdminReservationsRangeList } from '@/features/court/components/AdminReservationsRangeList';

type TabId = 'calendar' | 'list';

export default function AdminReservasPage() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar');

  const events: any[] = [];
  const courts: any[] = [];

  return (
    <main className="h-screen bg-zinc-50">
      <div className="flex flex-col h-full">
        {/* HEADER + TABS */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Reservas</h1>
            <p className="text-xs text-zinc-500">
              Gestión de reservas por calendario o listado.
            </p>
          </div>

          <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 text-sm">
            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={
                'px-4 py-1.5 rounded-lg transition ' +
                (activeTab === 'calendar'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100')
              }
            >
              Calendario
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={
                'px-4 py-1.5 rounded-lg transition ' +
                (activeTab === 'list'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100')
              }
            >
              Listado
            </button>
          </div>
        </header>

        {/* CONTENIDO FULL HEIGHT */}
        <section className="flex-1">
          {activeTab === 'calendar' && (
            // 👇 deja que el propio calendario se encargue del layout interno
            <CanchaCalendarRBC dataSource="api" />
          )}

           {activeTab === 'list' && (
            <div className="h-full p-4">
              <AdminReservationsRangeList />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
