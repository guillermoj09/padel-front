'use client';

import { useMemo, useState } from 'react';
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useReservationsRange } from '@/features/court/hooks/useReservationsRange';
import type { CalendarEvent } from '@/features/court/hooks/useCalendarDay';

const HOY = new Date();

type ViewMode = 'week' | 'month';

export function AdminReservationsRangeList() {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [anchorDate, setAnchorDate] = useState<Date>(HOY);

  // filtro de estado: 'all' o alguno de los estados de CalendarEvent
  const [estadoFilter, setEstadoFilter] = useState<
    'all' | CalendarEvent['estado']
  >('all');

  // por ahora dejamos una cancha por defecto "1" para que traiga datos
  // si quieres, puedes setear esto desde afuera o con un selector
  const [canchaId, setCanchaId] = useState<string | undefined>('1');

  // 🔥 useMemo para estabilizar from/to
  const { from, to } = useMemo(() => {
    const fromCalc =
      viewMode === 'week'
        ? startOfWeek(anchorDate, { locale: es, weekStartsOn: 1 })
        : startOfMonth(anchorDate);

    const toCalc =
      viewMode === 'week'
        ? endOfWeek(anchorDate, { locale: es, weekStartsOn: 1 })
        : endOfMonth(anchorDate);

    return { from: fromCalc, to: toCalc };
  }, [viewMode, anchorDate]);

  const { events, loading, error } = useReservationsRange({
    from,
    to,
    estado: estadoFilter,
    canchaId,
  });

  const rangeLabel =
    viewMode === 'week'
      ? `${format(from, "dd 'de' MMM", { locale: es })} - ${format(
          to,
          "dd 'de' MMM yyyy",
          { locale: es },
        )}`
      : format(from, "MMMM yyyy", { locale: es });

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Filtros / encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Rango</span>
          <span className="font-semibold">{rangeLabel}</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Cambiar rango: semana / mes */}
          <button
            type="button"
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded text-sm border ${
              viewMode === 'week'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700'
            }`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded text-sm border ${
              viewMode === 'month'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700'
            }`}
          >
            Mes
          </button>

          {/* Filtro de estado (ajusta opciones según tus estados reales) */}
          <select
            className="border rounded px-2 py-1 text-sm"
            value={estadoFilter}
            onChange={(e) =>
              setEstadoFilter(e.target.value as 'all' | CalendarEvent['estado'])
            }
          >
            <option value="all">Todos</option>
            <option value="pending">Pendiente</option>
            <option value="confirmed">Confirmado</option>
            <option value="cancelled">Cancelado</option>
          </select>

          {/* Selector simple de cancha por ID */}
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="ID cancha (ej: 1)"
            value={canchaId ?? ''}
            onChange={(e) =>
              setCanchaId(e.target.value ? e.target.value : undefined)
            }
          />
        </div>
      </div>

      {/* Contenido principal: tabla de resultados */}
      <div className="flex-1 overflow-auto border rounded-md p-3 bg-white">
        {loading && <div>Cargando reservas...</div>}

        {error && (
          <div className="text-sm text-red-600">
            Error cargando reservas: {error}
          </div>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="text-sm text-gray-500">
            No hay reservas en este rango.
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-1">ID</th>
                <th className="text-left py-2 px-1">Título</th>
                <th className="text-left py-2 px-1">Cancha</th>
                <th className="text-left py-2 px-1">Inicio</th>
                <th className="text-left py-2 px-1">Fin</th>
                <th className="text-left py-2 px-1">Estado</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev.id} className="border-b last:border-b-0">
                  <td className="py-1 px-1">{ev.id}</td>
                  <td className="py-1 px-1">{ev.title}</td>
                  <td className="py-1 px-1">{ev.resourceId}</td>
                  <td className="py-1 px-1">
                    {format(ev.start, "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="py-1 px-1">
                    {format(ev.end, "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="py-1 px-1 capitalize">{ev.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
