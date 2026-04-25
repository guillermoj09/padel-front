"use client";

import React, { useMemo } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  EventPropGetter,
  SlotInfo,
  View,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";
import "react-big-calendar/lib/css/react-big-calendar.css";

/**
 * Evento usado por React Big Calendar.
 *
 * Mantén start y end como Date antes de pasarlos al calendario.
 * Si tu backend devuelve fechas como string, conviértelas antes o deja
 * que este componente las convierta cuando sea posible.
 */
export type CanchaCalendarEvent = {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  estado?: "disponible" | "reservada" | "bloqueada" | "cancelada" | string;
  canchaId?: string | number;
  cliente?: string;
  raw?: unknown;
};

type CalendarSlot = {
  start: Date;
  end: Date;
  slots: Date[];
  action: SlotInfo["action"];
};

export type CanchaCalendarRBCProps = {
  /**
   * Tu componente padre está usando:
   * <CanchaCalendarRBC dataSource="api" />
   *
   * Por eso esta prop debe existir aunque, por ahora, el calendario
   * no haga fetch automático aquí.
   */
  dataSource?: "api" | "local" | string;

  events?: CanchaCalendarEvent[];
  defaultDate?: Date;
  defaultView?: View;
  height?: number | string;
  onSelectEvent?: (event: CanchaCalendarEvent) => void;
  onSelectSlot?: (slot: CalendarSlot) => void;
};

const locales = {
  es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function getEventColor(estado?: CanchaCalendarEvent["estado"]): string {
  switch (estado) {
    case "disponible":
      return "#16a34a";
    case "reservada":
      return "#2563eb";
    case "bloqueada":
      return "#dc2626";
    case "cancelada":
      return "#6b7280";
    default:
      return "#0f172a";
  }
}

export default function CanchaCalendarRBC({
  dataSource = "local",
  events = [],
  defaultDate = new Date(),
  defaultView = Views.WEEK,
  height = 650,
  onSelectEvent,
  onSelectSlot,
}: CanchaCalendarRBCProps) {
  /**
   * dataSource queda aceptado para mantener compatibilidad con el componente padre.
   * Si luego quieres que este componente cargue reservas desde API,
   * aquí se puede agregar un useEffect con fetch/axios.
   */
  void dataSource;

  const calendarEvents = useMemo<CanchaCalendarEvent[]>(() => {
    return events.map((event) => ({
      ...event,
      start: event.start instanceof Date ? event.start : new Date(event.start),
      end: event.end instanceof Date ? event.end : new Date(event.end),
    }));
  }, [events]);

  const eventPropGetter: EventPropGetter<CanchaCalendarEvent> = (event) => {
    const backgroundColor = getEventColor(event.estado);

    return {
      style: {
        backgroundColor,
        color: "#ffffff",
        borderRadius: "8px",
        border: "none",
        padding: "2px 6px",
        fontSize: "0.85rem",
      },
    };
  };

  const handleSelectEvent = (event: CanchaCalendarEvent) => {
    onSelectEvent?.(event);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    onSelectSlot?.({
      start: slotInfo.start,
      end: slotInfo.end,
      slots: slotInfo.slots,
      action: slotInfo.action,
    });
  };

  return (
    <div style={{ height }}>
      <Calendar<CanchaCalendarEvent>
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
        defaultDate={defaultDate}
        defaultView={defaultView}
        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
        selectable
        popup
        eventPropGetter={eventPropGetter}
        onSelectEvent={handleSelectEvent}
        onSelectSlot={handleSelectSlot}
        messages={{
          next: "Siguiente",
          previous: "Anterior",
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
          agenda: "Agenda",
          date: "Fecha",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "No hay eventos en este rango.",
          showMore: (total) => `+ Ver ${total} más`,
        }}
      />
    </div>
  );
}
