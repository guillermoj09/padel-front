'use client';

import { useState } from 'react';
import type { CalendarEvent } from '@/features/court/hooks/useCalendarDay';
import type { DataSource } from '@/features/court/api/types';
import CanchaCalendarRBC from '@/features/court/components/CanchaCalendarRBC';
import { AdminReservationsTable } from '@/features/court/components/AdminReservationsTable';

type Court = { id: string; title: string };

type Props = {
  events: CalendarEvent[];
  courts: Court[];
  dataSource?: DataSource;
};

type TabId = 'calendar' | 'list';

export function AdminReservasScreen({ events, courts, dataSource }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('calendar');

  return (
    <div className="space-y-4">
      {/* TABS */}
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

      {/* CONTENIDO */}
      <div className="rounded-2xl bg-white border border-zinc-200 p-4">
        {activeTab === 'calendar' && (
          <div className="h-[80vh]">
            <CanchaCalendarRBC dataSource={dataSource} />
          </div>
        )}

        {activeTab === 'list' && (
          <AdminReservationsTable
            events={events}
            courts={courts}
            onCancel={(id) => {
              // aquí luego conectas tu lógica de cancelar (modal + useCancelCourtEvent)
              console.log('Cancelar reserva', id);
            }}
          />
        )}
      </div>
    </div>
  );
}
