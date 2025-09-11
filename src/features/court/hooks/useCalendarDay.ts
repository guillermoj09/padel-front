import { useEffect, useState } from 'react';
import { getCourtApi } from '@/features/court/api/clientFactory';
import type { DataSource, CourtDTO, BookingDTO } from '@/features/court/api/types';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  estado: 'reservado' | 'confirmado';
}

export function useCalendarDay(params: { date: Date; source?: DataSource; maxCourts?: number }) {
  const { date, source, maxCourts = 10 } = params;
  const api = getCourtApi(source);

  const [courts, setCourts] = useState<CourtDTO[]>([]);
  const [eventsAll, setEventsAll] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setError('');
        const { courts, bookings } = await api.listCalendarDay({ date });
        if (!alive) return;

        // Cap de seguridad por si el backend devuelve > maxCourts
        const allowed = new Set(courts.slice(0, maxCourts).map(c => c.id));
        setCourts(courts.slice(0, maxCourts));
        setEventsAll(
          bookings
            .filter(b => allowed.has(b.courtId))
            .map((b: BookingDTO) => ({
              id: String(b.id),
              title: b.title,
              start: new Date(b.startTime),
              end: new Date(b.endTime),
              resourceId: b.courtId,
              estado: b.status,
            }))
        );
      } catch (e: any) {
        if (alive) setError(e.message || 'Error cargando calendario del día');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false };
  }, [api, date.getFullYear(), date.getMonth(), date.getDate(), maxCourts]);

  return { courts, eventsAll, loading, error };
}
