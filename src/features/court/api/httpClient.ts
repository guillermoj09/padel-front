import { startOfDay, endOfDay } from 'date-fns';
import type {
  CourtApi,
  CourtDTO,
  BookingDTO,
  CalendarDayResponse,
  PaymentMethod,
  PaymentStatus,
  BookingStatus,
} from './types';
import { isRecord } from '@/lib/errors';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '/api';

type ApiRow = Record<string, unknown>;

type ApiCalendarRow = {
  id: string;
  rawId?: string | number;
  title?: string;
  start: string;
  end: string;
  estado?: 'reservada' | 'bloqueada' | 'cancelada' | string;
  status?: string;
  canchaId?: string | number;
  courtId?: string | number;
  court_id?: string | number;
  resourceId?: string | number;
  type?: 'booking' | 'court_block' | string;
  raw?: unknown;
  paymentMethod?: string;
  payment_method?: string;
  paymentStatus?: string;
  payment_status?: string;
  paidAt?: string | null;
  paid_at?: string | null;
  paymentConfirmedBy?: string | null;
  payment_confirmed_by?: string | null;
  phoneNumber?: string;
  contactPhone?: string;
};

type CalendarBookingDTO = BookingDTO & {
  estado?: string;
  resourceId?: string;
  canchaId?: string;
  type?: string;
  raw?: unknown;
};

function toErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data)) return fallback;

  const message = data.message;
  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

async function handle<T>(res: Response): Promise<T> {
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(toErrorMessage(data, res.statusText));
  }
  return data as T;
}

async function withConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit = 6,
): Promise<T[]> {
  const result: T[] = [];
  let index = 0;

  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    async () => {
      while (index < tasks.length) {
        const currentIndex = index;
        index += 1;
        result[currentIndex] = await tasks[currentIndex]();
      }
    },
  );

  await Promise.all(workers);
  return result;
}

function readString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function readOptionalString(value: unknown): string | null {
  const normalized = readString(value, '');
  return normalized ? normalized : null;
}

function readStatus(value: unknown): BookingStatus {
  const normalized = readString(value, 'reservado');

  if (normalized === 'pendiente') return 'reservado';

  if (
    normalized === 'reservado' ||
    normalized === 'confirmado' ||
    normalized === 'pending' ||
    normalized === 'confirmed' ||
    normalized === 'cancelled' ||
    normalized === 'reservada' ||
    normalized === 'bloqueada' ||
    normalized === 'cancelada'
  ) {
    return normalized as BookingStatus;
  }

  return 'reservado';
}

function readPaymentMethod(value: unknown): PaymentMethod {
  const normalized = readString(value, 'pendiente');

  if (
    normalized === 'pendiente' ||
    normalized === 'transferencia' ||
    normalized === 'efectivo' ||
    normalized === 'tarjeta'
  ) {
    return normalized;
  }

  return 'pendiente';
}

function readPaymentStatus(value: unknown): PaymentStatus {
  const normalized = readString(value, 'pending');
  return normalized === 'paid' ? 'paid' : 'pending';
}

function mapCourt(row: ApiRow): CourtDTO {
  return {
    id: readString(row.id),
    title: readString(row.title ?? row.name ?? row.id),
    type: readString(row.type),
  };
}

function mapBooking(row: ApiRow, courtId: string): BookingDTO {
  return {
    id: readString(row.id),
    courtId: readString(row.courtId ?? row.court_id ?? courtId),
    title: readString(row.title, 'Reserva'),
    status: readStatus(row.status),
    phoneNumber: readString(row.phoneNumber ?? row.contactPhone, ''),
    startTime: new Date(
      readString(row.startTime ?? row.start_time),
    ).toISOString(),
    endTime: new Date(readString(row.endTime ?? row.end_time)).toISOString(),
    paymentMethod: readPaymentMethod(row.paymentMethod ?? row.payment_method),
    paymentStatus: readPaymentStatus(row.paymentStatus ?? row.payment_status),
    paidAt: readOptionalString(row.paidAt ?? row.paid_at),
    paymentConfirmedBy: readOptionalString(
      row.paymentConfirmedBy ?? row.payment_confirmed_by,
    ),
  };
}

function mapCalendarEvent(
  row: ApiCalendarRow,
  fallbackCourtId: string,
): CalendarBookingDTO {
  const courtId = readString(
    row.resourceId ?? row.canchaId ?? row.courtId ?? row.court_id,
    fallbackCourtId,
  );

  const estado = readString(row.estado ?? row.status, 'reservada');

  return {
    id: readString(row.id),
    courtId,
    canchaId: courtId,
    resourceId: courtId,
    title: readString(
      row.title,
      estado === 'bloqueada' ? 'Cancha bloqueada' : 'Reserva',
    ),
    status: readStatus(estado),
    estado,
    type: readString(row.type),
    phoneNumber: readString(row.phoneNumber ?? row.contactPhone, ''),
    startTime: new Date(readString(row.start)).toISOString(),
    endTime: new Date(readString(row.end)).toISOString(),
    paymentMethod: readPaymentMethod(row.paymentMethod ?? row.payment_method),
    paymentStatus: readPaymentStatus(row.paymentStatus ?? row.payment_status),
    paidAt: readOptionalString(row.paidAt ?? row.paid_at),
    paymentConfirmedBy: readOptionalString(
      row.paymentConfirmedBy ?? row.payment_confirmed_by,
    ),
    raw: row.raw ?? row,
  };
}

export const httpClient: CourtApi = {
  async listCourts(): Promise<CourtDTO[]> {
    const res = await fetch(`${API_BASE}/courts`, { credentials: 'include' });
    const data = await handle<ApiRow[]>(res);
    return data.map(mapCourt);
  },

  async listBookingsByDay({ date, courtIds }): Promise<BookingDTO[]> {
    const start = startOfDay(date).toISOString();
    const end = endOfDay(date).toISOString();

    const ids = courtIds?.length ? courtIds : [];
    if (!ids.length) return [];

    const tasks = ids.map((id) => async () => {
      const url = `${API_BASE}/bookings/court/${encodeURIComponent(
        id,
      )}/calendar?from=${encodeURIComponent(start)}&to=${encodeURIComponent(
        end,
      )}`;

      const res = await fetch(url, { credentials: 'include' });
      const rows = await handle<ApiCalendarRow[]>(res);

      return rows.map((row) => mapCalendarEvent(row, id));
    });

    const perCourt = await withConcurrency(tasks, 6);
    return perCourt.flat();
  },

  async listCalendarDay({ date }): Promise<CalendarDayResponse> {
    const courts = await this.listCourts();
    const bookings = await this.listBookingsByDay({
      date,
      courtIds: courts.map((court) => court.id),
    });

    return { courts, bookings };
  },
};
