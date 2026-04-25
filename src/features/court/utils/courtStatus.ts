import type { CalendarEvent } from '@/features/court/hooks/useCalendarDay';

export const CANCELABLE_STATES = new Set([
  'pending',
  'reserved',
  'confirmed',
]);

export function normalizeEstado(value?: string | null): CalendarEvent['estado'] {
  const estado = String(value ?? '').trim().toLowerCase();

  if (['pending', 'pendiente'].includes(estado)) {
    return 'pending' as CalendarEvent['estado'];
  }

  if (['reserved', 'reservado', 'reservada'].includes(estado)) {
    return 'reserved' as CalendarEvent['estado'];
  }

  if (['confirmed', 'confirmado', 'confirmada'].includes(estado)) {
    return 'confirmed' as CalendarEvent['estado'];
  }

  if (['canceled', 'cancelado', 'cancelada'].includes(estado)) {
    return 'canceled' as CalendarEvent['estado'];
  }

  return 'pending' as CalendarEvent['estado'];
}
