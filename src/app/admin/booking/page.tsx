// app/admin/reservas/page.tsx
'use client';

import { useState } from 'react';
import CanchaCalendarRBC from '@/features/court/components/CanchaCalendarRBC';
import { AdminReservationsRangeList } from '@/features/court/components/AdminReservationsRangeList';

type TabId = 'calendar' | 'list';

export default function AdminReservasPage() {
  const [activeTab, setActiveTab] = useState<TabId>('calendar');

  return (
    <main className="h-screen bg-zinc-50">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
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
                'rounded-lg px-4 py-1.5 transition ' +
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
                'rounded-lg px-4 py-1.5 transition ' +
                (activeTab === 'list'
                  ? 'bg-zinc-900 text-white shadow-sm'
                  : 'text-zinc-600 hover:bg-zinc-100')
              }
            >
              Listado
            </button>
          </div>
        </header>

        <section className="flex-1">
          {activeTab === 'calendar' && <CanchaCalendarRBC dataSource="api" />}

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
