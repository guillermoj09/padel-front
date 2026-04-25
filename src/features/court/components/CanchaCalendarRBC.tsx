"use client";

import React, { useMemo } from "react";
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type SlotInfo,
  type View,
  Views,
} from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale/es";

export type CanchaCalendarEvent = {
  id: string | number;
  title: string;
  start: Date | string;
  end: Date | string;
  estado?: "disponible" | "reservada" | "bloqueada" | "cancelada" | string;
  canchaId?: string | number;
  cliente?: string;
  raw?: unknown;
};

export type NormalizedCanchaCalendarEvent = Omit<
  CanchaCalendarEvent,
  "start" | "end"
> & {
  start: Date;
  end: Date;
};

type CalendarSlot = {
  start: Date;
  end: Date;
  slots: Date[];
  action: SlotInfo["action"];
};

export type CanchaCalendarRBCProps = {
  dataSource?: "api" | "local" | string;
  events?: CanchaCalendarEvent[];
  defaultDate?: Date;
  defaultView?: View;
  height?: number | string;
  onSelectEvent?: (event: NormalizedCanchaCalendarEvent) => void;
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

function getEventColor(estado?: NormalizedCanchaCalendarEvent["estado"]): string {
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

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
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
  void dataSource;

  const calendarEvents = useMemo<NormalizedCanchaCalendarEvent[]>(() => {
    return events.map((event) => ({
      ...event,
      start: toDate(event.start),
      end: toDate(event.end),
    }));
  }, [events]);

  const eventPropGetter: EventPropGetter<NormalizedCanchaCalendarEvent> = (
    event,
  ) => {
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

  const handleSelectEvent = (event: NormalizedCanchaCalendarEvent) => {
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
      <Calendar<NormalizedCanchaCalendarEvent>
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
