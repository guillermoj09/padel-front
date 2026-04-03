'use client';

import { useEffect, useState } from 'react';
import type { CalendarEvent } from './useCalendarDay';
import type {
  PaymentMethod,
  PaymentStatus,
} from '@/features/court/api/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3002';

type Estado = CalendarEvent['estado'] | 'paid' | 'all';

type UseReservationsRangeParams = {
  from: Date;
  to: Date;
  estado?: Estado;
  canchaId?: string;
};

export type ReservationRangeEvent = CalendarEvent & {
  priceApplied?: number | null;
  currencyApplied?: string | null;
  phoneNumber?: string | null;
  customerPhone?: string | null;
  customerName?: string | null;
  clientName?: string | null;
  contactName?: string | null;
  courtName?: string | null;
  courtTitle?: string | null;
  notes?: string | null;
  description?: string | null;
};

type UseReservationsRangeResult = {
  events: ReservationRangeEvent[];
  loading: boolean;
  error: string | null;
};

type ApiRow = Record<string, unknown>;

function readString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

function readNullableString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  return undefined;
}

function readNullableNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeEstado(value: unknown): CalendarEvent['estado'] {
  const estado = readString(value).toLowerCase();

  if (['confirmado', 'confirmed'].includes(estado)) return 'confirmado';
  if (['cancelado', 'cancelada', 'cancelled', 'canceled'].includes(estado)) {
    return 'cancelado';
  }
  if (['reservado', 'reservada', 'reserved', 'pending', 'pendiente'].includes(estado)) {
    return 'pending';
  }

  return 'pending';
}

function normalizePaymentStatus(value: unknown): PaymentStatus | undefined {
  const paymentStatus = readString(value).toLowerCase();

  if (!paymentStatus) return undefined;
  if (['paid', 'pagado', 'payed'].includes(paymentStatus)) return 'paid';
  if (['pending', 'pendiente'].includes(paymentStatus)) return 'pending';

  return undefined;
}

function normalizePaymentMethod(value: unknown): PaymentMethod | undefined {
  const paymentMethod = readString(value).toLowerCase();

  if (!paymentMethod) return undefined;
  if (['efectivo', 'cash'].includes(paymentMethod)) return 'efectivo';
  if (['transferencia', 'transfer', 'bank_transfer', 'wire'].includes(paymentMethod)) {
    return 'transferencia';
  }
  if (['tarjeta', 'card', 'credit_card', 'debit_card'].includes(paymentMethod)) {
    return 'tarjeta';
  }
  if (['pendiente', 'pending'].includes(paymentMethod)) return 'pendiente';

  return undefined;
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

export function useReservationsRange({
  from,
  to,
  estado = 'all',
  canchaId,
}: UseReservationsRangeParams): UseReservationsRangeResult {
  const [events, setEvents] = useState<ReservationRangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        if (!canchaId) {
          setEvents([]);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.set('from', from.toISOString());
        params.set('to', to.toISOString());

        if (estado !== 'all') {
          params.set('status', String(estado).toLowerCase());
        }

        const url = `${API_BASE}/bookings/court/${encodeURIComponent(
          canchaId,
        )}?${params.toString()}`;

        const res = await fetch(url, {
          credentials: 'include',
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json: unknown = await res.json();
        if (cancelled) return;

        const items: ApiRow[] = Array.isArray((json as { items?: unknown })?.items)
          ? (((json as { items?: unknown[] }).items ?? []) as ApiRow[])
          : Array.isArray(json)
            ? (json as ApiRow[])
            : [];

        const mapped: ReservationRangeEvent[] = items.map((row) => ({
          id: readString(row.id),
          title:
            readNullableString(
              row.title ??
                row.nombre ??
                row.customerName ??
                row.clientName ??
                row.contactName,
            ) ?? 'Sin título',
          start: toDate(row.startTime ?? row.start),
          end: toDate(row.endTime ?? row.end),
          resourceId: readString(row.courtId ?? row.canchaId ?? row.resourceId),
          estado: normalizeEstado(row.estado ?? row.status),

          paymentStatus: normalizePaymentStatus(
            row.paymentStatus ?? row.payment_state ?? row.statusPayment,
          ),
          paymentMethod: normalizePaymentMethod(
            row.paymentMethod ?? row.paymentType ?? row.payment_method,
          ),

          priceApplied:
            readNullableNumber(row.priceApplied) ??
            readNullableNumber(row.amount) ??
            readNullableNumber(row.total) ??
            readNullableNumber(row.price),

          currencyApplied:
            readNullableString(row.currencyApplied ?? row.currency) ?? 'CLP',

          phoneNumber: readNullableString(
            row.phoneNumber ??
              row.customerPhone ??
              row.phone ??
              row.cellphone ??
              row.celular ??
              row.telefono,
          ),

          customerPhone: readNullableString(
            row.customerPhone ??
              row.phoneNumber ??
              row.phone ??
              row.cellphone ??
              row.celular ??
              row.telefono,
          ),

          customerName: readNullableString(
            row.customerName ??
              row.clientName ??
              row.contactName ??
              row.name ??
              row.fullName,
          ),

          clientName: readNullableString(
            row.clientName ??
              row.customerName ??
              row.contactName ??
              row.name ??
              row.fullName,
          ),

          contactName: readNullableString(
            row.contactName ?? row.customerName ?? row.clientName,
          ),
          courtName: readNullableString(row.courtName ?? row.courtTitle),
          courtTitle: readNullableString(row.courtTitle ?? row.courtName),
          notes: readNullableString(
            row.notes ?? row.note ?? row.observations ?? row.comment,
          ),
          description: readNullableString(row.description ?? row.notes),
        }));

        setEvents(mapped);
      } catch (e: unknown) {
        if (cancelled) return;

        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('Error cargando reservas');
        }
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
