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

// --- Localizador RBC + date-fns (ES) ---
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// --- "Hoy" anclado a zona horaria para evitar desfaces TZ/DST ---
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

// --- Colores por estado ---
function eventPropGetter(event: CalendarEvent) {
  const base: React.CSSProperties = {
    borderRadius: 10,
    border: 'none',
    color: '#111827',
    fontWeight: 600,
  };
  const bg =
    event.estado === 'confirmado'
      ? '#bbf7d0' // verde suave
      : event.estado === 'reservado' || event.estado === 'pending'
        ? '#fecaca' // rojo suave
        : '#e5e7eb'; // gris
  return { style: { ...base, backgroundColor: bg } };
}

type Props = { dataSource?: DataSource };

// Estados que se pueden cancelar desde la grilla
const CANCELABLE_STATES = new Set(['pending', 'reservado']);

export default function CanchaCalendarRBC({ dataSource }: Props) {
  const [view, setView] = useState(Views.DAY);
  const [date, setDate] = useState<Date>(FECHA_INICIAL);

  const { courts, eventsAll, loading, error } = useCalendarDay({
    date,
    source: dataSource,
    maxCourts: 10,
  });

  const {
    createEvent,
    loading: savingEvent,
    error: saveError,
  } = useCreateCourtEvent();

  const {
    cancelEvent,
    loading: canceling,
    error: cancelError,
  } = useCancelCourtEvent();

  // canchas visibles (ids seleccionados)
  const [selected, setSelected] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  // reservas creadas desde el front (aún no sincronizadas)
  const [confirmed, setConfirmed] = useState<CalendarEvent[]>([]);
  // ids cancelados (para ocultar en vista)
  const [canceledIds, setCanceledIds] = useState<Set<string>>(new Set());

  // modal crear
  const [isOpen, setIsOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>(undefined);
  const [slotEnd, setSlotEnd] = useState<Date | undefined>(undefined);
  const [slotResourceId, setSlotResourceId] = useState<string | undefined>(undefined);

  // modal cancelar
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<CalendarEvent | null>(null);

  // seleccionar primeras 3 canchas una sola vez
  useEffect(() => {
    if (!bootstrapped && courts.length) {
      setSelected(courts.slice(0, 3).map((c) => c.id));
      setBootstrapped(true);
    }
  }, [courts, bootstrapped]);

  // recursos visibles para RBC
  const resources = useMemo(
    () => courts.filter((r) => selected.includes(r.id)),
    [courts, selected]
  );

  // combinar eventos backend + creados localmente, filtrando cancelados
  const events = useMemo(() => {
    const cancelFilter = (e: CalendarEvent) =>
      !canceledIds.has(String(e.id)) && selected.includes(e.resourceId);

    return [
      ...eventsAll.filter(cancelFilter),
      ...confirmed.filter(cancelFilter),
    ];
  }, [eventsAll, confirmed, canceledIds, selected]);

  // limpieza: si un "confirmado local" ya llegó desde backend, quitarlo de local
  useEffect(() => {
    setConfirmed((prev) =>
      prev.filter((c) => !eventsAll.some((e) => String(e.id) === String(c.id)))
    );
  }, [eventsAll]);

  // ancho mínimo de grilla según cantidad de recursos
  const minWidthPx = useMemo(
    () => Math.max(900, resources.length * 220),
    [resources.length]
  );

  // bloquear selección de slots en días pasados
  const isSameOrAfterToday = (d: Date) => {
    const cmp = new Date(d);
    cmp.setHours(0, 0, 0, 0);
    const limit = new Date(FECHA_INICIAL);
    limit.setHours(0, 0, 0, 0);
    return cmp >= limit;
  };
  const RESERVATION_MINUTES = 90; // 1h 30min


  // selección de slot para crear
const handleSelectSlot = (info: SlotInfo & { resourceId?: string }) => {
  // si el start es de un día pasado, ignorar
  if (!isSameOrAfterToday(info.start)) return;

  // calculamos siempre 1h30 a partir del inicio
  const start = info.start;
  const end = addMinutes(start, RESERVATION_MINUTES);

  // (opcional) evitar reservas que se salgan del horario máximo (23:00)
  const closing = new Date(start);
  closing.setHours(23, 0, 0, 0);
  if (end > closing) {
    // aquí podrías mostrar un toast de “no se puede reservar más tarde”
    return;
  }

  setSlotStart(start);
  setSlotEnd(end);

  const rid = info.resourceId ?? resources?.[0]?.id;
  setSlotResourceId(rid ? String(rid) : undefined);
  setIsOpen(true);
};
  function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

  const closeModal = () => {
    setIsOpen(false);
    setSlotStart(undefined);
    setSlotEnd(undefined);
    setSlotResourceId(undefined);
  };

  // guardar nueva reserva
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
    try {
      const saved = await createEvent({
        courtId,
        start,
        end,
        title,
        notes,
      });

      if (saved) {
        const savedEvt: CalendarEvent = {
          id: String(saved.id),
          title: saved.title ?? title,
          start: new Date(saved.startTime ?? start),
          end: new Date(saved.endTime ?? end),
          resourceId: String(saved.courtId ?? courtId),
          estado: (saved.estado ?? saved.status ?? 'confirmado') as CalendarEvent['estado'],
        };
        setConfirmed((prev) => [...prev, savedEvt]);
        closeModal();
        return;
      }

      console.warn('No se guardó la reserva', saveError);
    } catch (e) {
      console.error('Error guardando la reserva', e);
    }
  };

  // click en evento → abrir modal de cancelar (si es cancelable)
  const handleSelectEvent = (ev: CalendarEvent) => {
    if (!CANCELABLE_STATES.has(ev.estado)) return;
    setEventToCancel(ev);
    setIsCancelOpen(true);
  };

  // confirmar cancelación en modal
  const handleConfirmCancel = async (reason?: string) => {
    if (!eventToCancel) return;

    const ok = await cancelEvent({
      id: String(eventToCancel.id),
      reason,
    });

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

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const formattedDate = format(date, "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="h-[80vh] font-[system-ui]">
      <div className="h-full rounded-2xl bg-white shadow-sm border border-zinc-200 flex flex-col">
        {/* Header superior */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Calendario de reservas
            </h1>
            <p className="text-xs text-zinc-500">
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-green-200 border border-green-300" />
                Confirmado
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-red-200 border border-red-300" />
                Reservado / pendiente
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-3 w-3 rounded-full bg-gray-200 border border-gray-300" />
                Otro
              </span>
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <div className="flex-1 grid grid-cols-[260px,1fr] gap-4 p-4 overflow-hidden">
          {/* Sidebar izquierda */}
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-700">
                  Canchas visibles
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelected(courts.map((r) => r.id))}
                    disabled={!courts.length}
                    className="px-2 py-1 rounded-lg text-[11px] border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40"
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setSelected([])}
                    disabled={!courts.length}
                    className="px-2 py-1 rounded-lg text-[11px] border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-40"
                  >
                    Ninguna
                  </button>
                </div>
              </div>

              {loading && (
                <div className="text-xs text-zinc-500">Cargando canchas…</div>
              )}
              {error && (
                <div className="text-xs text-red-600">
                  Error cargando canchas: {error}
                </div>
              )}
              {cancelError && (
                <div className="text-[11px] text-red-600">
                  Error al cancelar: {String(cancelError)}
                </div>
              )}

              <div className="flex-1 overflow-auto space-y-1.5 pr-1">
                {courts.map((r) => (
                  <label
                    key={r.id}
                    className="flex items-center gap-2 text-xs text-zinc-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={() => toggle(r.id)}
                      className="accent-black"
                    />
                    <span className="truncate">{r.title}</span>
                  </label>
                ))}
              </div>

              <div className="border-t border-zinc-200 pt-2 mt-1">
                <div className="text-xs font-medium text-zinc-700 mb-1">
                  Reservas del día
                </div>
                {!loading && events.length === 0 && (
                  <div className="text-[11px] text-zinc-500">
                    Sin reservas para esta fecha.
                  </div>
                )}
                <ul className="text-[11px] text-zinc-700 space-y-1 max-h-32 overflow-auto pr-1">
                  {events.map((ev) => (
                    <li key={ev.id} className="flex justify-between gap-2">
                      <span className="tabular-nums">
                        {format(ev.start, 'HH:mm')}–{format(ev.end, 'HH:mm')}
                      </span>
                      <span className="truncate flex-1 text-right">
                        {ev.title} · {ev.resourceId}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>

          {/* Calendario principal */}
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
                  onSelecting={(range) => isSameOrAfterToday(range.start)}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  style={{ height: '100%' }}
                  longPressThreshold={250}
                />
              </div>
            </div>
          </section>
        </div>
      </div>

      <ReserveModal
        isOpen={isOpen}
        resources={resources}
        defaultCourtId={slotResourceId}
        defaultStart={slotStart}
        defaultEnd={slotEnd}
        onClose={closeModal}
        onSave={handleSaveBooking}
        saving={savingEvent}
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
        title={
          eventToCancel
            ? `Cancelar: ${eventToCancel.title}`
            : 'Cancelar reserva'
        }
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
