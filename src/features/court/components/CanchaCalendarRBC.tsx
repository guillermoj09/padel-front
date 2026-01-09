'use client';

import React, { useMemo, useState, useEffect } from 'react';
import {
  Calendar as RBCalendar,
  Views,
  dateFnsLocalizer,
  type SlotInfo,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import Calendar from 'react-calendar';

import { useCalendarDay, type CalendarEvent } from '@/features/court/hooks/useCalendarDay';
import type { DataSource } from '@/features/court/api/types';
import { ReserveModal } from '@/features/court/components/ReserveModal';
import { useCreateCourtEvent } from '@/features/court/hooks/useCreateCourtEvent';
import { CancelModal } from '@/features/court/components/CancelModal';
import { useCancelCourtEvent } from '@/features/court/hooks/useCancelCourtEvent';
import { ReservationInfoModal } from '@/features/court/components/ReservationInfoModal';

// ---- Localizador ---
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});
// ---- Fecha inicial ---
function todayInTimeZone(tz: string) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('es-CL', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value) - 1;
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  return new Date(y, m, d);
}

const FECHA_INICIAL = todayInTimeZone('America/Santiago');


// ---- Estados visuales eventos ---
function eventPropGetter(event: CalendarEvent) {
  const base: React.CSSProperties = {
    borderRadius: 10,
    border: 'none',
    color: '#111827',
    fontWeight: 600,
  };

  const bg =
    event.estado === 'confirmado'
      ? '#bbf7d0'
      : event.estado === 'reservado' || event.estado === 'pending'
        ? '#fecaca'
        : '#e5e7eb';

  return { style: { ...base, backgroundColor: bg } };
}

type Props = { dataSource?: DataSource };
const CANCELABLE_STATES = new Set(['pending', 'reserved', 'confirmed']);

// ==========================
//  HORARIOS PERMITIDOS
// ==========================

// intervalos válidos para 1h30
const ALLOWED_SLOTS = [
  { h: 7, m: 0 },
  { h: 8, m: 30 },
  { h: 10, m: 0 },
  { h: 11, m: 30 },
  { h: 17, m: 0 },
  { h: 18, m: 30 },
  { h: 20, m: 0 },
  { h: 21, m: 30 },
];

// helper: sumar minutos
const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000);

const RESERVATION_MINUTES = 90; // 1h 30m


// ==========================
//      COMPONENTE
// ==========================

export default function CanchaCalendarRBC({ dataSource }: Props) {
  const [view, setView] = useState(Views.DAY);
  const [date, setDate] = useState<Date>(FECHA_INICIAL);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { courts, eventsAll, loading, error } = useCalendarDay({
    date,
    source: dataSource,
    maxCourts: 10,
  });

  const {
    createEvent,
    loading: savingEvent,
  } = useCreateCourtEvent();

  const {
    cancelEvent,
    loading: canceling,
  } = useCancelCourtEvent();


  // selección de canchas visibles
  const [selected, setSelected] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  // eventos locales + cancelados
  const [confirmed, setConfirmed] = useState<CalendarEvent[]>([]);
  const [canceledIds, setCanceledIds] = useState<Set<string>>(new Set());

  // modales
  const [isOpen, setIsOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>();
  const [slotEnd, setSlotEnd] = useState<Date | undefined>();
  const [slotResourceId, setSlotResourceId] = useState<string | undefined>();

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<CalendarEvent | null>(null);


  // seleccionar primeras 3 canchas
  useEffect(() => {
    if (!bootstrapped && courts.length) {
      setSelected(courts.slice(0, 3).map((c) => c.id));
      setBootstrapped(true);
    }
  }, [courts, bootstrapped]);


  const resources = useMemo(
    () => courts.filter((r) => selected.includes(r.id)),
    [courts, selected]
  );


  // combinar eventos backend + locales
  const events = useMemo(() => {
    const cancelFilter = (e: CalendarEvent) =>
      !canceledIds.has(String(e.id)) && selected.includes(e.resourceId);

    return [
      ...eventsAll.filter(cancelFilter),
      ...confirmed.filter(cancelFilter),
    ];
  }, [eventsAll, confirmed, canceledIds, selected]);


  // limpiar eventos locales ya sincronizados
  useEffect(() => {
    setConfirmed((prev) =>
      prev.filter((c) => !eventsAll.some((e) => String(e.id) === String(c.id)))
    );
  }, [eventsAll]);


  // bloquear días pasados
  const isSameOrAfterToday = (d: Date) => {
    const cmp = new Date(d);
    cmp.setHours(0, 0, 0, 0);

    const limit = new Date(FECHA_INICIAL);
    limit.setHours(0, 0, 0, 0);

    return cmp >= limit;
  };


  // ==========================
  //   BLOQUEAR HORAS NO VÁLIDAS
  // ==========================

  const isAllowedTime = (d: Date) => {
    const h = d.getHours();
    const m = d.getMinutes();
    return ALLOWED_SLOTS.some(t => t.h === h && t.m === m);
  };


  // selección de slot
  const handleSelectSlot = (info: SlotInfo & { resourceId?: string }) => {
    if (!isSameOrAfterToday(info.start)) return;

    // solo horarios válidos
    if (!isAllowedTime(info.start)) return;

    const start = info.start;
    const end = addMinutes(start, RESERVATION_MINUTES);

    // cierre máximo 23:00
    const closing = new Date(start);
    closing.setHours(23, 0, 0, 0);
    if (end > closing) return;

    setSlotStart(start);
    setSlotEnd(end);
    setSlotResourceId(info.resourceId ?? resources?.[0]?.id);
    setIsOpen(true);
  };


  // guardar reserva
  const handleSaveBooking = async ({
    title,
    courtId,
    start,
    end,
    notes,
  }: {
    title: string;
    courtId: string;
    start: Date;
    end: Date;
    notes?: string;
  }) => {

    const saved = await createEvent({
      courtId,
      start,
      end,
      title,
      notes,
    });

    if (saved) {
      setConfirmed((prev) => [
        ...prev,
        {
          id: String(saved.id),
          title: saved.title ?? title,
          start: new Date(saved.startTime ?? start),
          end: new Date(saved.endTime ?? end),
          resourceId: String(saved.courtId ?? courtId),
          estado: (saved.estado ?? saved.status ?? 'confirmado') as CalendarEvent['estado'],
        },
      ]);

      setIsOpen(false);
      setSlotStart(undefined);
      setSlotEnd(undefined);
      setSlotResourceId(undefined);
    }
  };


  // cancelar evento
  const handleSelectEvent = (ev: CalendarEvent) => {
    console.log("le di click");
    setSelectedEvent(ev);
    setIsInfoOpen(true);
  };



  const handleConfirmCancel = async (reason?: string) => {
    if (!eventToCancel) return;

    const ok = await cancelEvent({ id: String(eventToCancel.id), reason });
    if (!ok) return;

    setCanceledIds((prev) => {
      const next = new Set(prev);
      next.add(String(eventToCancel.id));
      return next;
    });

    setConfirmed((prev) =>
      prev.filter((e) => String(e.id) !== String(eventToCancel.id))
    );

    setIsCancelOpen(false);
    setEventToCancel(null);
  };
  const handleAskDeleteFromInfo = () => {
    if (!selectedEvent) return;
    if (!CANCELABLE_STATES.has(selectedEvent.estado)) return;

    setEventToCancel(selectedEvent);
    setIsCancelOpen(true);
    setIsInfoOpen(false); // opcional
  };


  // grid tamaño
  const minWidthPx = useMemo(
    () => Math.max(900, resources.length * 220),
    [resources.length]
  );


  const formattedDate = format(date, "EEEE d 'de' MMMM yyyy", { locale: es });


  return (
    <div className="h-[80vh] font-[system-ui]">
      <div className="h-full rounded-2xl bg-white shadow-sm border border-zinc-200 flex flex-col">

        {/* ----- ENCABEZADO ----- */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
          <div>
            <h1 className="text-lg font-semibold">Calendario de reservas</h1>
            <p className="text-xs text-zinc-500">
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </p>
          </div>
        </header>


        {/* ----- CONTENIDO ----- */}
        <div className="flex-1 grid grid-cols-[260px,1fr] gap-4 p-4 overflow-hidden">

          {/* ------ Sidebar izquierda ------- */}
          <aside className="h-full flex flex-col gap-3">

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-2">
              <Calendar
                locale="es"
                calendarType="iso8601"
                value={date}
                onChange={(d) => {
                  const picked = d as Date;
                  setDate(picked < FECHA_INICIAL ? FECHA_INICIAL : picked);
                }}
                next2Label={null}
                prev2Label={null}
                minDate={FECHA_INICIAL}
              />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3 flex-1 flex flex-col gap-3">
              <span className="text-xs font-medium text-zinc-700">Canchas visibles</span>

              <div className="flex gap-1">
                <button
                  onClick={() => setSelected(courts.map(r => r.id))}
                  className="px-2 py-1 text-xs border rounded bg-zinc-50"
                >
                  Todas
                </button>
                <button
                  onClick={() => setSelected([])}
                  className="px-2 py-1 text-xs border rounded bg-zinc-50"
                >
                  Ninguna
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                {courts.map((r) => (
                  <label key={r.id} className="flex items-center gap-1 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => {
                        setSelected(prev =>
                          prev.includes(r.id)
                            ? prev.filter(x => x !== r.id)
                            : [...prev, r.id]
                        );
                      }}
                    />
                    <span>{r.title}</span>
                  </label>
                ))}
              </div>

            </div>
          </aside>


          {/* ------ Calendario principal ------- */}
          <section className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="h-full overflow-x-auto">
              <div style={{ minWidth: minWidthPx }}>

                <RBCalendar
                  localizer={localizer}
                  culture="es"
                  date={date}
                  onNavigate={(next) => {
                    setDate(next < FECHA_INICIAL ? FECHA_INICIAL : next);
                  }}

                  view={view}
                  onView={setView}
                  defaultView={Views.DAY}
                  views={[Views.DAY, Views.WEEK]}

                  step={30}
                  timeslots={1}

                  min={new Date(1970, 0, 1, 7)}
                  max={new Date(1970, 0, 1, 23)}

                  events={events}
                  eventPropGetter={eventPropGetter}

                  resources={resources}
                  resourceIdAccessor="id"
                  resourceTitleAccessor="title"

                  selectable

                  // ---- BLOQUEAR HORAS NO PERMITIDAS ----
                  onSelecting={(range) => {
                    if (!isSameOrAfterToday(range.start)) return false;
                    return isAllowedTime(range.start);
                  }}

                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}

                  // ---- colores visuales para horas inválidas ----
                  slotPropGetter={(date) => {
                    const allowed = isAllowedTime(date);
                    return {
                      className: allowed
                        ? "bg-white hover:bg-blue-50"
                        : "bg-gray-100 opacity-40 cursor-not-allowed"
                    };
                  }}

                  style={{ height: '100%' }}
                  longPressThreshold={250}
                />

              </div>
            </div>
          </section>

        </div>
      </div>


      {/* ------ MODALES ------ */}

      <ReserveModal
        isOpen={isOpen}
        resources={resources}
        defaultCourtId={slotResourceId}
        defaultStart={slotStart}
        defaultEnd={slotEnd}
        onClose={() => {
          setIsOpen(false);
          setSlotStart(undefined);
          setSlotEnd(undefined);
          setSlotResourceId(undefined);
        }}
        onSave={handleSaveBooking}
        saving={savingEvent}
      />
      <ReservationInfoModal
        isOpen={isInfoOpen}
        event={selectedEvent}
        courtTitle={
          selectedEvent
            ? courts.find(c => c.id === selectedEvent.resourceId)?.title
            : undefined
        }
        canDelete={!!selectedEvent && CANCELABLE_STATES.has(selectedEvent.estado)}
        onClose={() => {
          setIsInfoOpen(false);
          setSelectedEvent(null);
        }}
        onDelete={handleAskDeleteFromInfo}
      />


      <CancelModal
        isOpen={isCancelOpen}
        onClose={() => {
          if (canceling) return;
          setIsCancelOpen(false);
          setEventToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        loading={canceling}
        title={eventToCancel ? `Cancelar: ${eventToCancel.title}` : 'Cancelar reserva'}
      />


      {(loading || savingEvent || canceling) && (
        <div className="fixed right-4 bottom-4 z-50 rounded-2xl bg-zinc-900 text-white px-3 py-2 text-xs shadow-xl flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          <span>
            {canceling
              ? 'Cancelando…'
              : savingEvent
                ? 'Guardando…'
                : 'Cargando…'}
          </span>
        </div>
      )}

    </div>
  );
}
