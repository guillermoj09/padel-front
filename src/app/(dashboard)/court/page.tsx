'use client';

import '@schedule-x/theme-default/dist/index.css';
import { ScheduleXCalendar, useNextCalendarApp } from '@schedule-x/react';
import {
  createViewWeek,
  createViewDay,
  createViewMonthGrid,
  createViewMonthAgenda,
} from '@schedule-x/calendar';
import { createEventsServicePlugin } from '@schedule-x/events-service';

import { useState } from 'react';
import { EventModal } from '@/features/court/components/EventModal';

export default function PruebaCalendario() {
  const [modalOpen, setModalOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [slotEnd, setSlotEnd] = useState<string | null>(null);

  function openModal(start: string, end: string) {
    console.log('✅ Abriendo modal con:', start, end);
    setSlotStart(start);
    setSlotEnd(end);
    setModalOpen(true);
  }

  const eventsService = createEventsServicePlugin();

  const calendar = useNextCalendarApp({
    locale: 'es-ES',
    views: [
      createViewWeek(),
      createViewDay(),
      createViewMonthGrid(),
      createViewMonthAgenda(),
    ],
    events: [],
    plugins: [
      eventsService,
      {
        name: 'manual-slot-plugin',
        onTimeSlotClick: (_ctx: any, slot: any) => {
          console.log('🟢 Slot clickeado:', slot);
          openModal(slot.dateRange.start, slot.dateRange.end);
          return true;
        },
      },
    ],
    dayBoundaries: {
      start: '07:00',
      end: '23:00',
    },
  });

  return (
    <>
      <h1 className="text-xl font-bold p-4">Calendario de Prueba</h1>
      <ScheduleXCalendar calendarApp={calendar} />

      {modalOpen && slotStart && slotEnd && (
        <EventModal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          onSave={(title) => {
            console.log('💾 Guardado:', title);
            setModalOpen(false);
          }}
          start={slotStart}
          end={slotEnd}
        />
      )}
    </>
  );
}
  