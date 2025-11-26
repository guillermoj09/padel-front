'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';

import type { CalendarEvent } from '@/features/court/hooks/useCalendarDay';

type Court = { id: string; title: string };

type Props = {
  events: CalendarEvent[];
  courts: Court[];
  onCancel?: (id: string) => void; // acción opcional
};

function estadoBadge(estado: CalendarEvent['estado']) {
  const base =
    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium';
  switch (estado) {
    case 'confirmado':
      return `${base} bg-green-100 text-green-800`;
    case 'reservado':
    case 'pending':
      return `${base} bg-amber-100 text-amber-800`;
    case 'cancelado':
      return `${base} bg-red-100 text-red-800`;
    default:
      return `${base} bg-zinc-100 text-zinc-700`;
  }
}

export function AdminReservationsTable({ events, courts, onCancel }: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<'all' | CalendarEvent['estado']>('all');

  const courtsById = useMemo(
    () => new Map(courts.map((c) => [String(c.id), c.title])),
    [courts]
  );

  const filtered = useMemo(() => {
    return events
      .slice()
      .sort((a, b) => a.start.getTime() - b.start.getTime())
      .filter((ev) => {
        if (statusFilter !== 'all' && ev.estado !== statusFilter) return false;
        if (!search.trim()) return true;
        const q = search.toLowerCase();

        const canchaTitle = courtsById.get(ev.resourceId)?.toLowerCase() ?? '';
        const title = ev.title?.toLowerCase() ?? '';

        return (
          title.includes(q) ||
          canchaTitle.includes(q)
          // si luego añades clienteNombre, clienteTelefono, etc.
        );
      });
  }, [events, search, statusFilter, courtsById]);

  return (
    <div className="space-y-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o cancha…"
            className="w-64 max-w-xs rounded-lg border border-zinc-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
          />
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | CalendarEvent['estado'])
            }
            className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-black/10"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmado">Confirmados</option>
            <option value="reservado">Reservados</option>
            <option value="pending">Pendientes</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        <div className="text-xs text-zinc-500">
          {filtered.length} reserva(s) encontradas
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-xs text-zinc-500">
              <th className="px-3 py-2 font-medium">Fecha</th>
              <th className="px-3 py-2 font-medium">Horario</th>
              <th className="px-3 py-2 font-medium">Cancha</th>
              <th className="px-3 py-2 font-medium">Título</th>
              <th className="px-3 py-2 font-medium">Estado</th>
              <th className="px-3 py-2 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-xs text-zinc-500"
                >
                  No hay reservas que coincidan con los filtros.
                </td>
              </tr>
            )}

            {filtered.map((ev) => {
              const cancha =
                courtsById.get(ev.resourceId) ?? `Cancha ${ev.resourceId}`;
              const fecha = format(ev.start, 'dd/MM/yyyy', { locale: es });
              const hora = `${format(ev.start, 'HH:mm')} – ${format(ev.end, 'HH:mm')}`;

              return (
                <tr key={ev.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2 align-middle">{fecha}</td>
                  <td className="px-3 py-2 align-middle tabular-nums">{hora}</td>
                  <td className="px-3 py-2 align-middle">{cancha}</td>
                  <td className="px-3 py-2 align-middle">
                    <span className="font-medium">
                      {ev.title || 'Sin título'}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className={estadoBadge(ev.estado)}>{ev.estado}</span>
                  </td>
                  <td className="px-3 py-2 align-middle text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button className="text-xs px-2 py-1 rounded-lg border border-zinc-200 hover:bg-zinc-50">
                        Ver
                      </button>
                      {onCancel &&
                        (ev.estado === 'pending' ||
                          ev.estado === 'reservado') && (
                          <button
                            onClick={() => onCancel(ev.id)}
                            className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                          >
                            Cancelar
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
