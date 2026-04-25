import type React from 'react';
import type { CalendarEvent } from '@/features/court/hooks/useCalendarDay';
import { normalizeEstado } from './courtStatus';

export function eventPropGetter(event: CalendarEvent) {
  const estado = normalizeEstado(event.estado);

  const backgroundColor =
    estado === 'confirmed'
      ? '#dcfce7'
      : estado === 'reserved' || estado === 'pending'
        ? '#fecaca'
        : '#e5e7eb';

  const borderColor =
    estado === 'confirmed'
      ? '#86efac'
      : estado === 'reserved' || estado === 'pending'
        ? '#fca5a5'
        : '#d4d4d8';

  const base: React.CSSProperties = {
    borderRadius: 10,
    border: `1px solid ${borderColor}`,
    color: '#111827',
    fontWeight: 600,
  };

  return {
    style: {
      ...base,
      backgroundColor,
    },
  };
}
