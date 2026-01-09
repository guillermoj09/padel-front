'use client';

import React from 'react';
import { format } from 'date-fns';
import es from 'date-fns/locale/es';
import type { CalendarEvent } from '@/features/court/hooks/useCalendarDay';

type Props = {
  isOpen: boolean;
  event: CalendarEvent | null;
  courtTitle?: string;
  canDelete?: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export function ReservationInfoModal({
  isOpen,
  event,
  courtTitle,
  canDelete = true,
  onClose,
  onDelete,
}: Props) {
  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" aria-modal>
      <div className="bg-white rounded-xl shadow-xl w-[380px] max-w-[95vw] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Detalle de reserva</div>
            <div className="text-xs text-zinc-500">ID: {event.id}</div>
          </div>
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg border">
            Cerrar
          </button>
        </div>

        <div className="space-y-2 text-sm">
          <div>
            <div className="text-xs text-zinc-500">Título</div>
            <div className="font-medium">{event.title}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-zinc-500">Cancha</div>
              <div className="font-medium">{courtTitle ?? event.resourceId}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Estado</div>
              <div className="font-medium">{String(event.estado)}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500">Horario</div>
            <div className="font-medium">
              {format(event.start, "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })} –{' '}
              {format(event.end, 'HH:mm', { locale: es })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg border">
            OK
          </button>
          <button
            onClick={onDelete}
            disabled={!canDelete}
            className="px-3 py-1.5 text-sm rounded-lg bg-red-500 text-white disabled:opacity-60"
          >
            Cancelar reserva
          </button>
        </div>

        {!canDelete && (
          <div className="text-xs text-zinc-500">
            Esta reserva no se puede eliminar según su estado.
          </div>
        )}
      </div>
    </div>
  );
}
