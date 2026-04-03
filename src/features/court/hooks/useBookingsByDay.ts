import { useEffect, useMemo, useState } from 'react';
import { getCourtApi } from '@/features/court/api/clientFactory';
import type { DataSource, BookingDTO } from '@/features/court/api/types';
import { getErrorMessage } from '@/lib/errors';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string;
  estado: 'reservado' | 'confirmado';
}

export function useBookingsByDay(params: {
  date: Date;
  courtIds: string[];
  source?: DataSource;
}) {
  const { date, courtIds, source } = params;
  const api = getCourtApi(source);

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dateValue = date.getTime();
  const courtIdsKey = useMemo(() => courtIds.join('|'), [courtIds]);

  useEffect(() => {
    let alive = true;

    const currentDate = new Date(dateValue);
    const currentCourtIds = courtIdsKey ? courtIdsKey.split('|') : [];

    (async () => {
      try {
        setLoading(true);
        setError('');

        const data: BookingDTO[] = await api.listBookingsByDay({
          date: currentDate,
          courtIds: currentCourtIds,
        });

        if (!alive) return;

        setEvents(
          data.map((booking) => ({
            id: String(booking.id),
            title: booking.title,
            start: new Date(booking.startTime),
            end: new Date(booking.endTime),
            resourceId: booking.courtId,
            estado: booking.status === 'confirmado' ? 'confirmado' : 'reservado',
          })),
        );
      } catch (error: unknown) {
        if (alive) {
          setError(getErrorMessage(error, 'Error al listar reservas'));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [api, dateValue, courtIdsKey]);

  return { events, loading, error };
}
