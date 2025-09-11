import { useEffect, useState } from 'react';
import { getCourtApi } from '@/features/court/api/clientFactory';
import type { DataSource, BookingDTO } from '@/features/court/api/types';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  estado: 'reservado' | 'confirmado';
}

export function useBookingsByDay(params: { date: Date; courtIds: string[]; source?: DataSource }) {
  const { date, courtIds, source } = params;
  const api = getCourtApi(source);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true); setError('');
        const data: BookingDTO[] = await api.listBookingsByDay({ date, courtIds });
        if (!alive) return;
        setEvents(
          data.map(b => ({
            id: String(b.id),
            title: b.title,
            start: new Date(b.startTime),
            end: new Date(b.endTime),
            resourceId: b.courtId,
            estado: b.status,
          }))
        );
      } catch (e: any) {
        if (alive) setError(e.message || 'Error al listar reservas');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false };
  }, [api, date.getFullYear(), date.getMonth(), date.getDate(), courtIds.join('|')]);

  return { events, loading, error };
}
