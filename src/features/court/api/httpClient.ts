import { startOfDay, endOfDay } from 'date-fns';
import type {
  CourtApi,
  CourtDTO,
  BookingDTO,
  CalendarDayResponse,
  PaymentMethod,
  PaymentStatus,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as any)?.message || res.statusText);
  return data as T;
}

async function withConcurrency<T>(
  tasks: (() => Promise<T>)[],
  limit = 6,
): Promise<T[]> {
  const res: T[] = [];
  let i = 0;
  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    async () => {
      while (i < tasks.length) {
        const idx = i++;
        res[idx] = await tasks[idx]();
      }
    },
  );
  await Promise.all(workers);
  return res;
}

export const httpClient: CourtApi = {
  async listCourts(): Promise<CourtDTO[]> {
    const res = await fetch(`${API_BASE}/courts`, { credentials: 'include' });

    const data = await handle<any[]>(res);
    console.log('canchas:', JSON.stringify(data, null, 2));
    return data.map((c) => ({
      id: String(c.id),
      title: String(c.title ?? c.name ?? c.id),
      type: String(c.type),
    }));
  },

  async listBookingsByDay({ date, courtIds }): Promise<BookingDTO[]> {
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();

    const ids = courtIds?.length ? courtIds : [];
    if (!ids.length) return [];

    const tasks = ids.map((id) => async () => {
      const url = `${API_BASE}/bookings/court/${encodeURIComponent(id)}/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;
      const r = await fetch(url, { credentials: 'include' });
      const rows = await handle<any[]>(r);

      return rows.map((b) => ({
        id: String(b.id),
        courtId: String(b.courtId ?? b.court_id ?? id),
        title: String(b.title ?? 'Reserva'),
        status: (b.status === 'pendiente' ? 'reservado' : b.status) as BookingDTO['status'],
        phoneNumber: String(b.phoneNumber ?? b.contactPhone ?? ''),
        startTime: new Date(b.startTime ?? b.start_time).toISOString(),
        endTime: new Date(b.endTime ?? b.end_time).toISOString(),
        paymentMethod: (b.paymentMethod ?? b.payment_method ?? 'pendiente') as PaymentMethod,
        paymentStatus: (b.paymentStatus ?? b.payment_status ?? 'pending') as PaymentStatus,
        paidAt: b.paidAt ?? b.paid_at ?? null,
        paymentConfirmedBy:
          b.paymentConfirmedBy ?? b.payment_confirmed_by ?? null,
      })) as BookingDTO[];
    });

    const perCourt = await withConcurrency(tasks, 6);
    return perCourt.flat();
  },

  async listCalendarDay({ date }): Promise<CalendarDayResponse> {
    const courts = await this.listCourts();
    const bookings = await this.listBookingsByDay({
      date,
      courtIds: courts.map((c) => c.id),
    });
    console.log('bookings http:', JSON.stringify(bookings, null, 2));

    return { courts, bookings };
  },
};
