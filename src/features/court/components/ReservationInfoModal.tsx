'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';
import type { CalendarEvent } from '@/features/court/hooks/useCalendarDay';
import type { PaymentMethod } from '@/features/court/api/types';
import { confirmBookingPayment } from '@/features/court/services/bookingApi';

type Props = {
  isOpen: boolean;
  event: CalendarEvent | null;
  courtTitle?: string;
  canDelete?: boolean;
  onClose: () => void;
  onDelete: () => void;
  onPaymentConfirmed?: (
    bookingId: string,
    payload: {
      paymentMethod: PaymentMethod;
      paymentStatus: 'paid';
      paidAt: string;
      paymentConfirmedBy?: string | null;
    },
  ) => void;
};

export function ReservationInfoModal({
  isOpen,
  event,
  courtTitle,
  canDelete = true,
  onClose,
  onDelete,
  onPaymentConfirmed,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pendiente');
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  console.log( "event ", event );
  useEffect(() => {
    if (!event) return;
    setPaymentMethod(event.paymentMethod ?? 'pendiente');
    setPaymentMessage('');
  }, [event]);

  const isPaid = useMemo(() => event?.paymentStatus === 'paid', [event?.paymentStatus]);

  if (!isOpen || !event) return null;

  const estadoTexto =
    event.estado === 'confirmed'
      ? 'Confirmado'
      : String(event.estado ?? '-');

  const paymentStatusTexto = isPaid ? 'Pagado' : 'Pendiente';

  const paidAtTexto = event.paidAt
    ? format(new Date(event.paidAt), "d 'de' MMMM yyyy, HH:mm", { locale: es })
    : '-';

  async function handleConfirmPayment() {
    if (!event?.id) return;

    if (paymentMethod === 'pendiente') {
      setPaymentMessage('Selecciona una forma de pago antes de confirmar.');
      return;
    }

    setIsConfirmingPayment(true);
    setPaymentMessage('');
    console.log( "event.id ", event.id );
    try {
      const data = await confirmBookingPayment(event.id, paymentMethod);
      const paidAt = data?.paidAt ?? new Date().toISOString();

      setPaymentMessage('Pago confirmado correctamente.');

      onPaymentConfirmed?.(String(event.id), {
        paymentMethod,
        paymentStatus: 'paid',
        paidAt,
        paymentConfirmedBy: data?.paymentConfirmedBy ?? null,
      });
    } catch (error) {
      console.error(error);
      setPaymentMessage('Error al confirmar el pago.');
    } finally {
      setIsConfirmingPayment(false);
    }
  }


  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      aria-modal
    >
      <div className="bg-white rounded-xl shadow-xl w-[430px] max-w-[95vw] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold">Detalle de reserva</div>
            <div className="text-xs text-zinc-500">ID: {event.id}</div>
          </div>

          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-lg border">
            Cerrar
          </button>
        </div>

        <div className="space-y-3 text-sm">
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
              <div className="text-xs text-zinc-500">Estado reserva</div>
              <div className="font-medium">{estadoTexto}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-zinc-500">Horario</div>
            <div className="font-medium">
              {format(event.start, "EEEE d 'de' MMMM yyyy, HH:mm", { locale: es })} –{' '}
              {format(event.end, 'HH:mm', { locale: es })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-zinc-500">Teléfono</div>
              <div className="font-medium">{event.contactPhone ?? '-'}</div>
            </div>

            <div>
              <div className="text-xs text-zinc-500">Estado pago</div>
              <div className={`font-medium ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                {paymentStatusTexto}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="paymentMethod" className="block text-xs text-zinc-500 mb-1">
                Método de pago
              </label>

              <select
                id="paymentMethod"
                value={paymentMethod}
                disabled={isConfirmingPayment || isPaid}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium bg-white outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-60"
              >
                <option value="pendiente">Pendiente</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>

            <div>
              <div className="text-xs text-zinc-500">Pagado el</div>
              <div className="font-medium">{paidAtTexto}</div>
            </div>
          </div>

          {paymentMessage ? (
            <div
              className={`text-xs ${
                paymentMessage.toLowerCase().includes('error')
                  ? 'text-red-500'
                  : 'text-emerald-600'
              }`}
            >
              {paymentMessage}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 pt-2 flex-wrap">
          {!isPaid && (
            <button
              onClick={handleConfirmPayment}
              disabled={isConfirmingPayment || paymentMethod === 'pendiente'}
              className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white disabled:opacity-60"
            >
              {isConfirmingPayment ? 'Confirmando...' : 'Confirmar pago'}
            </button>
          )}

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
