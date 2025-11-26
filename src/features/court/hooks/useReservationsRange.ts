'use client';

import { useEffect, useState } from 'react';
import type { CalendarEvent } from './useCalendarDay';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3002';

type Estado = CalendarEvent['estado'] | 'all';

type UseReservationsRangeParams = {
  from: Date;
  to: Date;
  estado?: Estado;
  canchaId?: string;
};

type UseReservationsRangeResult = {
  events: CalendarEvent[];
  loading: boolean;
  error: string | null;
};

export function useReservationsRange({
  from,
  to,
  estado = 'all',
  canchaId,
}: UseReservationsRangeParams): UseReservationsRangeResult {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // si no hay canchaId, no llamamos a la API
        if (!canchaId) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.set('from', from.toISOString());
        params.set('to', to.toISOString());

        // si quieres filtrar por estado en el backend, lo mandamos como "status"
        if (estado !== 'all') {
          params.set('status', String(estado).toLowerCase());
        }

        // ej: http://localhost:3002/bookings/court/1?from=...&to=...&status=CONFIRMED
        const url = `${API_BASE}/bookings/court/${encodeURIComponent(
          canchaId,
        )}?${params.toString()}`;

        const res = await fetch(url, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = await res.json();
        if (cancelled) return;

        // por si tu API a veces devuelve { items: [...] } y a veces un array directo
        const items = Array.isArray(json.items) ? json.items : json;

        const mapped: CalendarEvent[] = items.map((r: any) => ({
          id: String(r.id),
          title: r.title ?? r.nombre ?? 'Sin título',
          start: new Date(r.startTime ?? r.start),
          end: new Date(r.endTime ?? r.end),
          resourceId: String(r.courtId ?? r.canchaId ?? r.resourceId),
          estado: (r.estado ?? r.status ?? 'confirmado') as CalendarEvent['estado'],
        }));

        setEvents(mapped);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Error cargando reservas');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [from, to, estado, canchaId]);

  return { events, loading, error };
}
