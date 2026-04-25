import { useEffect, useState } from 'react';
import { getCourtApi } from '@/features/court/api/clientFactory';
import type {
  DataSource,
  CourtDTO,
  BookingDTO,
  PaymentMethod,
  PaymentStatus,
} from '@/features/court/api/types';
import { getErrorMessage } from '@/lib/errors';

export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string | number;
  estado?: string;
  contactPhone?: string;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAt?: string | null;
  paymentConfirmedBy?: string | null;
};

export function useCalendarDay(params: {
  date: Date;
  source?: DataSource;
  maxCourts?: number;
}) {
  const { date, source, maxCourts = 10 } = params;
  const api = getCourtApi(source);

  const [courts, setCourts] = useState<CourtDTO[]>([]);
  const [eventsAll, setEventsAll] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const dateValue = date.getTime();

  useEffect(() => {
    let alive = true;
    const currentDate = new Date(dateValue);

    (async () => {
      try {
        setLoading(true);
        setError('');

        const { courts: courtList, bookings } = await api.listCalendarDay({
          date: currentDate,
        });

        if (!alive) return;

        const limitedCourts = courtList.slice(0, maxCourts);
        const allowed = new Set(limitedCourts.map((court) => court.id));

        setCourts(limitedCourts);
        setEventsAll(
          bookings
            .filter((booking) => allowed.has(booking.courtId))
            .map((booking: BookingDTO) => ({
              id: String(booking.id),
              title: booking.title,
              start: new Date(booking.startTime),
              end: new Date(booking.endTime),
              resourceId: booking.courtId,
              estado: booking.status,
              contactPhone: booking.phoneNumber,
              paymentMethod: booking.paymentMethod ?? 'pendiente',
              paymentStatus: booking.paymentStatus ?? 'pending',
              paidAt: booking.paidAt ?? null,
              paymentConfirmedBy: booking.paymentConfirmedBy ?? null,
            })),
        );
      } catch (error: unknown) {
        if (alive) {
          setError(getErrorMessage(error, 'Error cargando calendario del día'));
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [api, dateValue, maxCourts]);

  return { courts, eventsAll, loading, error };
}
