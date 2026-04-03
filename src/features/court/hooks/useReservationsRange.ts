'use client';

import { useEffect, useState } from 'react';
import type { CalendarEvent } from './useCalendarDay';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3002';

type Estado = CalendarEvent['estado'] | 'paid' | 'all';

type UseReservationsRangeParams = {
  from: Date;
  to: Date;
  estado?: Estado;
  canchaId?: string;
};

export type ReservationRangeEvent = CalendarEvent & {
  paymentStatus?: string | null;
  paymentMethod?: string | null;
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

        const json = await res.json();
        if (cancelled) return;

        const items = Array.isArray(json?.items)
          ? json.items
          : Array.isArray(json)
            ? json
            : [];

        const mapped: ReservationRangeEvent[] = items.map((r: any) => ({
          id: String(r.id),
          title: r.title ?? r.nombre ?? r.customerName ?? r.contactName ?? 'Sin título',
          start: new Date(r.startTime ?? r.start),
          end: new Date(r.endTime ?? r.end),
          resourceId: String(r.courtId ?? r.canchaId ?? r.resourceId ?? ''),
          estado: (r.estado ?? r.status ?? 'pending') as CalendarEvent['estado'],

          paymentStatus: r.paymentStatus ?? r.payment_state ?? r.statusPayment ?? null,
          paymentMethod: r.paymentMethod ?? r.paymentType ?? r.payment_method ?? null,

          priceApplied:
            r.priceApplied != null
              ? Number(r.priceApplied)
              : r.amount != null
                ? Number(r.amount)
                : r.total != null
                  ? Number(r.total)
                  : r.price != null
                    ? Number(r.price)
                    : null,

          currencyApplied: r.currencyApplied ?? r.currency ?? 'CLP',

          phoneNumber:
            r.phoneNumber ??
            r.customerPhone ??
            r.phone ??
            r.cellphone ??
            r.celular ??
            r.telefono ??
            null,

          customerPhone:
            r.customerPhone ??
            r.phoneNumber ??
            r.phone ??
            r.cellphone ??
            r.celular ??
            r.telefono ??
            null,

          customerName:
            r.customerName ??
            r.clientName ??
            r.contactName ??
            r.name ??
            r.fullName ??
            null,

          clientName:
            r.clientName ??
            r.customerName ??
            r.contactName ??
            r.name ??
            r.fullName ??
            null,

          contactName: r.contactName ?? r.customerName ?? r.clientName ?? null,
          courtName: r.courtName ?? r.courtTitle ?? null,
          courtTitle: r.courtTitle ?? r.courtName ?? null,
          notes: r.notes ?? r.note ?? r.observations ?? r.comment ?? null,
          description: r.description ?? r.notes ?? null,
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