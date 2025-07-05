'use client';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect } from 'react';
import { useFetchCourtEvents } from '@/features/court/hooks/useFetchCourtEvents';

import { useState } from 'react';
import { EventModal } from '@/features/court/components/EventModal';
import { useCourtSchedule } from '@/features/court/store/courtScheduleStore';
import { useCreateCourtEvent } from '@/features/court/hooks/useCreateCourtEvent';

import { nanoid } from 'nanoid';

type Props = {
  courtId: string;
};

export default function FullCalendarCourtSchedule({ courtId }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [slotInfo, setSlotInfo] = useState<{ start: string; end: string } | null>(null);
  //const events = useCourtSchedule((state) => state.getEvents(courtId));
  const addEvent = useCourtSchedule((state) => state.addEvent);

  const { fetchEvents } = useFetchCourtEvents();

  const loadCourtEvents = async (fetchInfo: any, successCallback: any, failureCallback: any) => {
   try {
    const data = await fetchEvents(courtId, fetchInfo.startStr, fetchInfo.endStr);

    if (!Array.isArray(data)) {
      console.warn("⚠️ fetchEvents no devolvió un array. Se usará []");
      return successCallback([]);
    }
    console.log("✅ Eventos a mostrar:", data);
    successCallback(data);
  } catch (err) {
    console.error("❌ Error cargando eventos:", err);
    failureCallback(err);
  }
};



  const { saveEventToBackend } = useCreateCourtEvent();

  const handleSelect = (info: any) => {
    setSlotInfo({ start: info.startStr, end: info.endStr });
    setModalOpen(true);
  };

  const handleSave = async (title: string) => {
    if (!slotInfo || !title.trim()) {
      alert('Por favor ingrese un título para el evento');
      return;
    }

    const newEvent = {
      id: nanoid(),
      title,
      start: slotInfo.start,
      end: slotInfo.end,
      courtId,
    };

    try {
      const savedEvent = await saveEventToBackend(courtId, newEvent);
      if (savedEvent) {
        addEvent(courtId, savedEvent); // Agregar al estado global
        setModalOpen(false);          // Cerrar el modal
      }
    } catch (error) {
      console.error('Error al guardar el evento:', error);
      alert('Ocurrió un error al guardar el evento. Intente nuevamente.');
    }
  };

  return (
    <>
      <FullCalendar
        plugins={[timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        selectable={true}
        select={handleSelect}
        events={loadCourtEvents}
        height="auto"
        locale="es"
        slotDuration="01:00:00"
        slotMinTime="07:00:00"
        slotMaxTime="23:00:00"
      />

      {modalOpen && slotInfo && (
        <EventModal
          isOpen={true}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
          start={slotInfo.start}
          end={slotInfo.end}
        />
      )}
    </>
  );
}
