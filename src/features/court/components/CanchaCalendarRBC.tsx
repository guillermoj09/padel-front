'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Calendar as RBCalendar,
  Views,
  dateFnsLocalizer,
  type SlotInfo,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import Calendar from 'react-calendar';

import {
  useCalendarDay,
  type CalendarEvent,
} from '@/features/court/hooks/useCalendarDay';
import type { DataSource } from '@/features/court/api/types';
import { ReserveModal } from '@/features/court/components/ReserveModal';
import { useCreateCourtEvent } from '@/features/court/hooks/useCreateCourtEvent';
import { CancelModal } from '@/features/court/components/CancelModal';
import { useCancelCourtEvent } from '@/features/court/hooks/useCancelCourtEvent';
import { ReservationInfoModal } from '@/features/court/components/ReservationInfoModal';
import { ErrorModal } from '@/features/court/components/ErrorModal';

// ---- Localizador ---
const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Fecha estable para primer render
const SAFE_INITIAL_DATE = new Date(2000, 0, 1);

// ---- Fecha inicial real en zona horaria ---
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

// ---- Helpers type cancha ---
function normalizeCourtType(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function isPadelType(value?: string | null) {
  const type = normalizeCourtType(value);
  return type.includes('padel');
}

function isFutbolType(value?: string | null) {
  const type = normalizeCourtType(value);
  return (
    type.includes('futbol') ||
    type.includes('football') ||
    type.includes('soccer')
  );
}

// ---- Helpers estado evento ---
function normalizeEstado(value?: string | null): CalendarEvent['estado'] {
  const estado = String(value ?? '').trim().toLowerCase();

  if (['pending', 'pendiente'].includes(estado)) {
    return 'pending' as CalendarEvent['estado'];
  }

  if (['reserved', 'reservado', 'reservada'].includes(estado)) {
    return 'reserved' as CalendarEvent['estado'];
  }

  if (['confirmed', 'confirmado', 'confirmada'].includes(estado)) {
    return 'confirmed' as CalendarEvent['estado'];
  }

  if (['canceled', 'cancelado', 'cancelada'].includes(estado)) {
    return 'canceled' as CalendarEvent['estado'];
  }

  return 'pending' as CalendarEvent['estado'];
}

// ---- Estados visuales eventos ---
function eventPropGetter(event: CalendarEvent) {
  const estado = normalizeEstado(event.estado);

  const bg =
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

  return { style: { ...base, backgroundColor: bg } };
}

type Props = { dataSource?: DataSource };
const CANCELABLE_STATES = new Set(['pending', 'reserved', 'confirmed']);

// ==========================
//  HORARIOS PERMITIDOS
// ==========================

// Pádel: bloques de 1h30
const PADEL_ALLOWED_SLOTS = [
  { h: 7, m: 0 },
  { h: 8, m: 30 },
  { h: 10, m: 0 },
  { h: 11, m: 30 },
  { h: 17, m: 0 },
  { h: 18, m: 30 },
  { h: 20, m: 0 },
  { h: 21, m: 30 },
];

// Fútbol: bloques de 1h, pero el último se corta en 23:59
const FUTBOL_ALLOWED_SLOTS = [
  { h: 7, m: 0 },
  { h: 8, m: 0 },
  { h: 9, m: 0 },
  { h: 10, m: 0 },
  { h: 11, m: 0 },
  { h: 12, m: 0 },
  { h: 13, m: 0 },
  { h: 14, m: 0 },
  { h: 15, m: 0 },
  { h: 16, m: 0 },
  { h: 17, m: 0 },
  { h: 18, m: 0 },
  { h: 19, m: 0 },
  { h: 20, m: 0 },
  { h: 21, m: 0 },
  { h: 22, m: 0 },
  { h: 23, m: 0 },
];

// helper: sumar minutos
const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60 * 1000);

// ==========================
//      COMPONENTE
// ==========================

export default function CanchaCalendarRBC({ dataSource }: Props) {
  const [mounted, setMounted] = useState(false);
  const [fechaInicial, setFechaInicial] = useState<Date>(SAFE_INITIAL_DATE);
  const [view, setView] = useState(Views.DAY);
  const [date, setDate] = useState<Date>(SAFE_INITIAL_DATE);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const { courts, eventsAll, loading } = useCalendarDay({
    date,
    source: dataSource,
    maxCourts: 10,
  });

  const {
    createEvent,
    loading: savingEvent,
    error: createError,
    resetError: resetCreateError,
  } = useCreateCourtEvent();

  const {
    cancelEvent,
    loading: canceling,
  } = useCancelCourtEvent();

  // selección de canchas visibles
  const [selected, setSelected] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  // eventos locales + cancelados
  const [confirmed, setConfirmed] = useState<CalendarEvent[]>([]);
  const [canceledIds, setCanceledIds] = useState<Set<string>>(new Set());

  // aviso de horario no disponible
  const [unavailableNotice, setUnavailableNotice] = useState<string | null>(null);
  const [unavailableNoticePosition, setUnavailableNoticePosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const unavailableNoticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // modales
  const [isOpen, setIsOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>();
  const [slotEnd, setSlotEnd] = useState<Date | undefined>();
  const [slotResourceId, setSlotResourceId] = useState<string | undefined>();

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const today = todayInTimeZone('America/Santiago');
    setFechaInicial(today);
    setDate(today);
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (unavailableNoticeTimeoutRef.current) {
        clearTimeout(unavailableNoticeTimeoutRef.current);
      }
    };
  }, []);

  const rememberPointerPosition = (
    e: React.MouseEvent<HTMLElement | HTMLDivElement | HTMLElement>
  ) => {
    lastPointerRef.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const getNoticePositionFromPointer = () => {
    const pointer = lastPointerRef.current;
    if (!pointer || typeof window === 'undefined') return null;

    const offsetX = 14;
    const offsetY = 18;
    const estimatedWidth = 260;
    const estimatedHeight = 46;
    const margin = 12;

    const x = Math.min(
      Math.max(margin, pointer.x + offsetX),
      window.innerWidth - estimatedWidth - margin
    );

    const y = Math.min(
      Math.max(margin, pointer.y + offsetY),
      window.innerHeight - estimatedHeight - margin
    );

    return { x, y };
  };

  const showUnavailableNotice = (message: string) => {
    setUnavailableNotice(message);
    setUnavailableNoticePosition(getNoticePositionFromPointer());

    if (unavailableNoticeTimeoutRef.current) {
      clearTimeout(unavailableNoticeTimeoutRef.current);
    }

    unavailableNoticeTimeoutRef.current = setTimeout(() => {
      setUnavailableNotice(null);
      setUnavailableNoticePosition(null);
    }, 2200);
  };

  // separar canchas por type
  const padelCourts = useMemo(
    () => courts.filter((c) => isPadelType(c.type)),
    [courts]
  );

  const futbolCourts = useMemo(
    () => courts.filter((c) => isFutbolType(c.type)),
    [courts]
  );

  const otherCourts = useMemo(
    () => courts.filter((c) => !isPadelType(c.type) && !isFutbolType(c.type)),
    [courts]
  );

  // seleccionar primeras 3 canchas
  useEffect(() => {
    if (!bootstrapped && courts.length) {
      setSelected(courts.slice(0, 3).map((c) => String(c.id)));
      setBootstrapped(true);
    }
  }, [courts, bootstrapped]);

  const resources = useMemo(
    () =>
      courts
        .filter((r) => selected.includes(String(r.id)))
        .map((r) => ({
          ...r,
          title: `${r.type} - ${r.title}`,
        })),
    [courts, selected]
  );

  const getCourtById = (courtId?: string) =>
    courts.find((c) => String(c.id) === String(courtId));

  const getAllowedSlotsByCourt = (courtId?: string) => {
    const type = getCourtById(courtId)?.type;

    if (isFutbolType(type)) return FUTBOL_ALLOWED_SLOTS;
    if (isPadelType(type)) return PADEL_ALLOWED_SLOTS;

    return null;
  };

  const getReservationEndByCourt = (start: Date, courtId?: string) => {
    const type = getCourtById(courtId)?.type;

    if (isFutbolType(type)) {
      const isLastSlot = start.getHours() === 23 && start.getMinutes() === 0;

      if (isLastSlot) {
        const end = new Date(start);
        end.setHours(23, 59, 0, 0);
        return end;
      }

      return addMinutes(start, 60);
    }

    if (isPadelType(type)) {
      return addMinutes(start, 90);
    }

    return addMinutes(start, 90);
  };

  const getClosingTimeByCourt = (start: Date, courtId?: string) => {
    const type = getCourtById(courtId)?.type;
    const closing = new Date(start);

    if (isFutbolType(type)) {
      closing.setHours(23, 59, 0, 0);
      return closing;
    }

    closing.setHours(23, 0, 0, 0);
    return closing;
  };

  const isAllowedTimeForCourt = (d: Date, courtId?: string) => {
    const allowedSlots = getAllowedSlotsByCourt(courtId);

    if (!allowedSlots) return true;

    const h = d.getHours();
    const m = d.getMinutes();

    return allowedSlots.some((t) => t.h === h && t.m === m);
  };

  const events = useMemo(() => {
    const cancelFilter = (e: CalendarEvent) =>
      !canceledIds.has(String(e.id)) &&
      selected.includes(String(e.resourceId));

    return [
      ...eventsAll.filter(cancelFilter),
      ...confirmed.filter(cancelFilter),
    ];
  }, [eventsAll, confirmed, canceledIds, selected]);

  useEffect(() => {
    setConfirmed((prev) =>
      prev.filter((c) => !eventsAll.some((e) => String(e.id) === String(c.id)))
    );
  }, [eventsAll]);

  const isSameOrAfterToday = (d: Date) => {
    const cmp = new Date(d);
    cmp.setHours(0, 0, 0, 0);

    const limit = new Date(fechaInicial);
    limit.setHours(0, 0, 0, 0);

    return cmp >= limit;
  };

  const handleSelectSlot = (
    info: SlotInfo & { resourceId?: string | number }
  ) => {
    if (!isSameOrAfterToday(info.start)) {
      showUnavailableNotice('No puedes reservar en fechas pasadas');
      return;
    }

    const courtId = String(info.resourceId ?? resources?.[0]?.id ?? '');

    if (!courtId) {
      showUnavailableNotice('Selecciona una cancha visible');
      return;
    }

    if (!isAllowedTimeForCourt(info.start, courtId)) {
      showUnavailableNotice('Horario no disponible para esta cancha');
      return;
    }

    const start = info.start;
    const end = getReservationEndByCourt(start, courtId);

    const closing = getClosingTimeByCourt(start, courtId);
    if (end > closing) {
      showUnavailableNotice('Este horario excede el cierre permitido');
      return;
    }

    setSlotStart(start);
    setSlotEnd(end);
    setSlotResourceId(courtId);
    setIsOpen(true);
  };

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

    if (!saved) {
      setIsErrorOpen(true);
      return;
    }

    setConfirmed((prev) => [
      ...prev,
      {
        id: String(saved.id),
        title: saved.title ?? title,
        start: new Date(saved.startTime ?? start),
        end: new Date(saved.endTime ?? end),
        resourceId: String(saved.courtId ?? courtId),
        estado: normalizeEstado(saved.estado ?? saved.status ?? 'confirmed'),
      } as CalendarEvent,
    ]);

    setIsOpen(false);
    setSlotStart(undefined);
    setSlotEnd(undefined);
    setSlotResourceId(undefined);
  };

  const handleSelectEvent = (ev: CalendarEvent) => {
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
    if (!CANCELABLE_STATES.has(normalizeEstado(selectedEvent.estado))) return;

    setEventToCancel(selectedEvent);
    setIsCancelOpen(true);
    setIsInfoOpen(false);
  };

  const minWidthPx = useMemo(
    () => Math.max(900, resources.length * 220),
    [resources.length]
  );

  if (!mounted) {
    return (
      <div className="h-[80vh] font-[system-ui]">
        <div className="h-full rounded-2xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center">
          <div className="text-sm text-zinc-500">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  const formattedDate = format(date, "EEEE d 'de' MMMM yyyy", { locale: es });

  return (
    <div className="h-[80vh] font-[system-ui]">
      <div className="h-full rounded-2xl bg-white shadow-sm border border-zinc-200 flex flex-col">
        <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-200">
          <div>
            <h1 className="text-lg font-semibold">Calendario de reservas</h1>
            <p className="text-xs text-zinc-500">
              {formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}
            </p>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-[260px,1fr] gap-4 p-4 overflow-hidden">
          <aside className="h-full flex flex-col gap-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-2">
              <Calendar
                locale="es"
                calendarType="iso8601"
                value={date}
                onChange={(value) => {
                  const picked = Array.isArray(value) ? value[0] : value;
                  if (!(picked instanceof Date)) return;

                  setDate(picked);
                }}
                next2Label={null}
                prev2Label={null}
              />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white p-3 flex-1 flex flex-col gap-3">
              <span className="text-xs font-medium text-zinc-700">
                Canchas visibles
              </span>

              <div className="flex gap-1">
                <button
                  onClick={() => setSelected(courts.map((r) => String(r.id)))}
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

              <div className="flex-1 overflow-auto flex flex-col gap-4">
                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-2">
                    Pádel
                  </p>

                  <div className="flex flex-col gap-1">
                    {padelCourts.map((r) => (
                      <label
                        key={String(r.id)}
                        className="flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(String(r.id))}
                          onChange={() => {
                            setSelected((prev) =>
                              prev.includes(String(r.id))
                                ? prev.filter((x) => x !== String(r.id))
                                : [...prev, String(r.id)]
                            );
                          }}
                        />
                        <span>{r.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-2">
                    Fútbol
                  </p>

                  <div className="flex flex-col gap-1">
                    {futbolCourts.map((r) => (
                      <label
                        key={String(r.id)}
                        className="flex items-center gap-1 text-xs cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(String(r.id))}
                          onChange={() => {
                            setSelected((prev) =>
                              prev.includes(String(r.id))
                                ? prev.filter((x) => x !== String(r.id))
                                : [...prev, String(r.id)]
                            );
                          }}
                        />
                        <span>{r.title}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {otherCourts.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-500 uppercase mb-2">
                      Otras
                    </p>

                    <div className="flex flex-col gap-1">
                      {otherCourts.map((r) => (
                        <label
                          key={String(r.id)}
                          className="flex items-center gap-1 text-xs cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selected.includes(String(r.id))}
                            onChange={() => {
                              setSelected((prev) =>
                                prev.includes(String(r.id))
                                  ? prev.filter((x) => x !== String(r.id))
                                  : [...prev, String(r.id)]
                              );
                            }}
                          />
                          <span>{r.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <section
            className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white"
            onMouseMove={rememberPointerPosition}
            onMouseDown={rememberPointerPosition}
            onClickCapture={rememberPointerPosition}
          >
            <div className="h-full overflow-x-auto">
              <div style={{ minWidth: minWidthPx }}>
                <RBCalendar
                  localizer={localizer}
                  culture="es"
                  date={date}
                  onNavigate={(next) => {
                    setDate(next);
                  }}
                  view={view}
                  onView={setView}
                  defaultView={Views.DAY}
                  views={[Views.DAY, Views.WEEK]}
                  step={30}
                  timeslots={1}
                  min={new Date(1970, 0, 1, 7)}
                  max={new Date(1970, 0, 1, 23, 59, 59, 999)}
                  events={events}
                  eventPropGetter={eventPropGetter}
                  resources={resources}
                  resourceIdAccessor="id"
                  resourceTitleAccessor="title"
                  selectable
                  onSelecting={(range) => {
                    if (!isSameOrAfterToday(range.start)) {
                      return false;
                    }

                    const resourceId = String(
                      (range as { resourceId?: string | number }).resourceId ??
                        resources?.[0]?.id ??
                        ''
                    );

                    if (!resourceId) return false;

                    return isAllowedTimeForCourt(range.start, resourceId);
                  }}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  dayPropGetter={() => ({
                    style: {
                      backgroundColor: '#ffffff',
                    },
                  })}
                  slotPropGetter={(slotDate, resourceId) => {
                    if (resourceId === undefined || resourceId === null) {
                      return {
                        style: {
                          backgroundColor: '#ffffff',
                        },
                      };
                    }

                    const courtId = String(resourceId);
                    const allowed =
                      isSameOrAfterToday(slotDate) &&
                      isAllowedTimeForCourt(slotDate, courtId);

                    return {
                      style: {
                        backgroundColor: allowed ? '#ffffff' : '#f3f4f6',
                        opacity: 1,
                      },
                      className: allowed ? '' : 'cursor-not-allowed',
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
            ? courts.find((c) => String(c.id) === String(selectedEvent.resourceId))
                ?.title
            : undefined
        }
        canDelete={
          !!selectedEvent &&
          CANCELABLE_STATES.has(normalizeEstado(selectedEvent.estado))
        }
        onClose={() => {
          setIsInfoOpen(false);
          setSelectedEvent(null);
        }}
        onDelete={handleAskDeleteFromInfo}
        onPaymentConfirmed={(bookingId, payload) => {
          setSelectedEvent((prev) =>
            prev && String(prev.id) === bookingId
              ? {
                  ...prev,
                  paymentMethod: payload.paymentMethod,
                  paymentStatus: payload.paymentStatus,
                  paidAt: payload.paidAt,
                  paymentConfirmedBy: payload.paymentConfirmedBy ?? null,
                }
              : prev,
          );

          setConfirmed((prev) =>
            prev.map((item) =>
              String(item.id) === bookingId
                ? {
                    ...item,
                    paymentMethod: payload.paymentMethod,
                    paymentStatus: payload.paymentStatus,
                    paidAt: payload.paidAt,
                    paymentConfirmedBy: payload.paymentConfirmedBy ?? null,
                  }
                : item,
            ),
          );
        }}
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

      <ErrorModal
        isOpen={isErrorOpen}
        message={createError ?? 'Horario no disponible'}
        onClose={() => {
          setIsErrorOpen(false);
          resetCreateError();
        }}
      />

      {unavailableNotice && unavailableNoticePosition ? (
        <div
          className="fixed z-50 rounded-2xl bg-zinc-900 text-white px-4 py-2 text-sm shadow-xl pointer-events-none"
          style={{
            left: unavailableNoticePosition.x,
            top: unavailableNoticePosition.y,
          }}
        >
          {unavailableNotice}
        </div>
      ) : null}

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