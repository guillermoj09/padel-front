'use client';

import { useState } from 'react';
import { EventModal, type EventModalPayload } from './EventModal';
import {
  isPastDate,
  toIsoDateString,
  validateBookingDates,
} from '@/lib/booking-date.utils';

type SelectedSlot = {
  start: string;
  end: string;
};

/**
 * Este archivo es un ejemplo de integración.
 * No lo pegues completo si ya tienes tu propio calendario.
 * Usa principalmente handleSelectSlot, handleSave y el uso de <EventModal />.
 */
export function CalendarParentExample() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null);

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    try {
      if (isPastDate(slotInfo.start)) {
        alert('No puedes crear una reserva en una fecha u hora pasada.');
        return;
      }

      const start = toIsoDateString(slotInfo.start);
      const end = toIsoDateString(slotInfo.end);

      validateBookingDates(start, end);

      setSelectedSlot({
        start,
        end,
      });

      setIsModalOpen(true);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'La fecha seleccionada no es válida.',
      );
    }
  };

  const handleSave = async (payload: EventModalPayload) => {
    validateBookingDates(payload.start, payload.end);

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: payload.title,
        start: payload.start,
        end: payload.end,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(data?.message || 'Error al crear la reserva.');
    }

    // Aquí puedes refrescar el calendario/listado después de crear la reserva.
    // await loadBookings();

    setSelectedSlot(null);
  };

  return (
    <>
      {/*
        EJEMPLO PARA REACT BIG CALENDAR:

        <Calendar
          selectable
          onSelectSlot={handleSelectSlot}
          ...
        />
      */}

      <button
        type="button"
        onClick={() =>
          handleSelectSlot({
            start: new Date(),
            end: new Date(Date.now() + 60 * 60 * 1000),
          })
        }
        className="rounded bg-blue-600 px-3 py-2 text-white"
      >
        Probar modal
      </button>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        onSave={handleSave}
        start={selectedSlot?.start ?? ''}
        end={selectedSlot?.end ?? ''}
      />
    </>
  );
}
