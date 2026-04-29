'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import {
  Calendar as RBCalendar,
  Views,
  dateFnsLocalizer,
  type SlotInfo,
  type View,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale/es';
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
import { AdminReservationsRangeList } from '@/features/court/components/AdminReservationsRangeList';

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
const BUSINESS_TIME_ZONE = 'America/Santiago';

type DateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function getDateTimePartsInTimeZone(date: Date, timeZone: string): DateTimeParts {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: getPart('year'),
    month: getPart('month'),
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
  };
}

function getLocalDateTimeParts(date: Date): DateTimeParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

function toDateTimeKey(parts: DateTimeParts) {
  return (
    parts.year * 100000000 +
    parts.month * 1000000 +
    parts.day * 10000 +
    parts.hour * 100 +
    parts.minute
  );
}

function isSameOrAfterCurrentBusinessMinute(date: Date) {
  const selectedKey = toDateTimeKey(getLocalDateTimeParts(date));
  const nowKey = toDateTimeKey(
    getDateTimePartsInTimeZone(new Date(), BUSINESS_TIME_ZONE),
  );

  return selectedKey >= nowKey;
}

function formatBusinessNow() {
  const now = getDateTimePartsInTimeZone(new Date(), BUSINESS_TIME_ZONE);
  const pad = (value: number) => String(value).padStart(2, '0');

  return pad(now.hour) + ':' + pad(now.minute);
}

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
type NormalizedEstado =
  | 'pending'
  | 'reserved'
  | 'confirmed'
  | 'canceled'
  | 'blocked';

type NormalizedPaymentStatus = 'paid' | 'pending' | 'unpaid' | 'unknown';

type PaymentOverride = {
  paymentMethod?: unknown;
  paymentStatus?: string | null;
  paidAt?: string | Date | null;
  paymentConfirmedBy?: unknown;
};

function normalizeEstado(value?: string | null): NormalizedEstado {
  const estado = String(value ?? '').trim().toLowerCase();

  if (['blocked', 'bloqueada', 'bloqueado'].includes(estado)) {
    return 'blocked';
  }

  if (['pending', 'pendiente'].includes(estado)) {
    return 'pending';
  }

  if (['reserved', 'reservado', 'reservada'].includes(estado)) {
    return 'reserved';
  }

  if (['confirmed', 'confirmado', 'confirmada'].includes(estado)) {
    return 'confirmed';
  }

  if (['canceled', 'cancelled', 'cancelado', 'cancelada'].includes(estado)) {
    return 'canceled';
  }

  return 'pending';
}

function normalizePaymentStatus(value?: string | null): NormalizedPaymentStatus {
  const status = String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (
    [
      'paid',
      'pagado',
      'pagada',
      'completed',
      'complete',
      'success',
      'succeeded',
      'approved',
      'aprobado',
      'aprobada',
    ].includes(status)
  ) {
    return 'paid';
  }

  if (['pending', 'pendiente'].includes(status)) {
    return 'pending';
  }

  if (['unpaid', 'no_pagado', 'no pagado', 'sin_pago', 'sin pago'].includes(status)) {
    return 'unpaid';
  }

  return 'unknown';
}

function isBlockedEvent(event?: CalendarEvent | null): boolean {
  if (!event) return false;

  const estado = normalizeEstado(event.estado);

  const eventWithMeta = event as CalendarEvent & {
    type?: string;
    raw?: {
      type?: string;
      status?: string;
    };
  };

  const type = String(eventWithMeta.type ?? eventWithMeta.raw?.type ?? '')
    .trim()
    .toLowerCase();

  const rawStatus = String(eventWithMeta.raw?.status ?? '')
    .trim()
    .toLowerCase();

  return (
    estado === 'blocked' ||
    type === 'court_block' ||
    type === 'admin_block' ||
    rawStatus === 'active'
  );
}

function isPaidEvent(event?: CalendarEvent | null): boolean {
  if (!event) return false;

  const eventWithPayment = event as CalendarEvent & {
    status?: string | null;
    paymentStatus?: string | null;
    payment_status?: string | null;
    paidAt?: string | Date | null;
    raw?: {
      status?: string | null;
      paymentStatus?: string | null;
      payment_status?: string | null;
      paidAt?: string | Date | null;
    };
  };

  const paymentStatus = normalizePaymentStatus(
    eventWithPayment.paymentStatus ??
      eventWithPayment.payment_status ??
      eventWithPayment.raw?.paymentStatus ??
      eventWithPayment.raw?.payment_status ??
      null,
  );

  if (paymentStatus === 'paid') return true;

  return Boolean(eventWithPayment.paidAt ?? eventWithPayment.raw?.paidAt);
}

const STATUS_STYLES = {
  blocked: {
    label: 'Bloqueado',
    backgroundColor: '#9CA3AF',
    borderColor: '#6B7280',
    color: '#FFFFFF',
  },
  confirmed: {
    label: 'Confirmada',
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    color: '#FFFFFF',
  },
  paid: {
    label: 'Pagada',
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
    color: '#FFFFFF',
  },
  pending: {
    label: 'Pendiente',
    backgroundColor: '#F59E0B',
    borderColor: '#D97706',
    color: '#111827',
  },
  canceled: {
    label: 'Cancelada',
    backgroundColor: '#DC2626',
    borderColor: '#B91C1C',
    color: '#FFFFFF',
  },
  default: {
    label: 'Otro estado',
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
    color: '#111827',
  },
} as const;

function getVisualStatus(event: CalendarEvent): keyof typeof STATUS_STYLES {
  if (isBlockedEvent(event)) return 'blocked';
  if (isPaidEvent(event)) return 'paid';

  const estado = normalizeEstado(event.estado);

  if (estado === 'confirmed' || estado === 'reserved') return 'confirmed';
  if (estado === 'pending') return 'pending';
  if (estado === 'canceled') return 'canceled';

  return 'default';
}

function StatusLegend() {
  const items: Array<keyof typeof STATUS_STYLES> = [
    'blocked',
    'confirmed',
    'paid',
    'pending',
    'canceled',
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-600">
      {items.map((key) => {
        const item = STATUS_STYLES[key];

        return (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full border"
              style={{
                backgroundColor: item.backgroundColor,
                borderColor: item.borderColor,
              }}
            />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

// ---- Estados visuales eventos ---
function eventPropGetter(event: CalendarEvent) {
  const visualStatus = getVisualStatus(event);
  const styleConfig = STATUS_STYLES[visualStatus];
  const disabled = visualStatus === 'blocked' || visualStatus === 'canceled';

  const style: React.CSSProperties = {
    borderRadius: 10,
    border: `1px solid ${styleConfig.borderColor}`,
    backgroundColor: styleConfig.backgroundColor,
    color: styleConfig.color,
    fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
    opacity: disabled ? 0.92 : 1,
  };

  return { style };
}

export type BookingAdminViewMode = 'calendar' | 'list';

export type CanchaCalendarRBCProps = {
  dataSource?: DataSource;
  activeView?: BookingAdminViewMode;
  onViewChange?: (view: BookingAdminViewMode) => void;
};

function BookingViewSwitcher({
  activeView,
  onViewChange,
}: {
  activeView: BookingAdminViewMode;
  onViewChange: (view: BookingAdminViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 text-sm shadow-sm">
      <button
        type="button"
        onClick={() => onViewChange('calendar')}
        className={
          'rounded-lg px-4 py-1.5 transition ' +
          (activeView === 'calendar'
            ? 'bg-zinc-900 text-white shadow-sm'
            : 'text-zinc-600 hover:bg-zinc-100')
        }
      >
        Calendario
      </button>

      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={
          'rounded-lg px-4 py-1.5 transition ' +
          (activeView === 'list'
            ? 'bg-zinc-900 text-white shadow-sm'
            : 'text-zinc-600 hover:bg-zinc-100')
        }
      >
        Listado
      </button>
    </div>
  );
}

const CANCELABLE_STATES = new Set<NormalizedEstado>(['pending', 'reserved', 'confirmed']);

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

export default function CanchaCalendarRBC({
  dataSource,
  activeView,
  onViewChange,
}: CanchaCalendarRBCProps) {
  const [mounted, setMounted] = useState(false);
  const [fechaInicial, setFechaInicial] = useState<Date>(SAFE_INITIAL_DATE);
  const [view, setView] = useState<View>(Views.DAY);
  const [date, setDate] = useState<Date>(SAFE_INITIAL_DATE);
  const [internalActiveView, setInternalActiveView] = useState<BookingAdminViewMode>('calendar');

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
  const [manualError, setManualError] = useState<string | null>(null);

  // eventos locales + cancelados
  const [confirmed, setConfirmed] = useState<CalendarEvent[]>([]);
  const [canceledIds, setCanceledIds] = useState<Set<string>>(new Set());
  const [paymentOverrides, setPaymentOverrides] = useState<
    Record<string, PaymentOverride>
  >({});

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
    const today = todayInTimeZone(BUSINESS_TIME_ZONE);
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
    const applyPaymentOverride = (event: CalendarEvent): CalendarEvent => {
      const override = paymentOverrides[String(event.id)];
      return override ? { ...event, ...override } : event;
    };

    const cancelFilter = (e: CalendarEvent) =>
      !canceledIds.has(String(e.id)) &&
      selected.includes(String(e.resourceId));

    return [
      ...eventsAll.map(applyPaymentOverride).filter(cancelFilter),
      ...confirmed.map(applyPaymentOverride).filter(cancelFilter),
    ];
  }, [eventsAll, confirmed, canceledIds, selected, paymentOverrides]);

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

  const getSlotCourtId = (value?: string | number | null) =>
    String(value ?? resources?.[0]?.id ?? '');

  const getCalendarDateForSlot = (slotDate: Date) => {
    const normalized = new Date(slotDate);

    if (normalized.getFullYear() < 1990) {
      normalized.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    }

    return normalized;
  };

  const validateReservationDateTime = ({
    courtId,
    start,
    end,
  }: {
    courtId: string;
    start: Date;
    end: Date;
  }) => {
    if (!courtId) {
      return 'Selecciona una cancha visible';
    }

    if (!isSameOrAfterToday(start)) {
      return 'No puedes reservar en fechas pasadas';
    }

    if (!isSameOrAfterCurrentBusinessMinute(start)) {
      return 'No puedes reservar una hora que ya pasó. Hora actual: ' + formatBusinessNow() + '.';
    }

    if (!isAllowedTimeForCourt(start, courtId)) {
      return 'Horario no disponible para esta cancha';
    }

    const expectedEnd = getReservationEndByCourt(start, courtId);
    if (end.getTime() !== expectedEnd.getTime()) {
      return 'La hora de término no corresponde al bloque permitido para esta cancha';
    }

    const closing = getClosingTimeByCourt(start, courtId);
    if (end > closing) {
      return 'Este horario excede el cierre permitido';
    }

    return null;
  };

  const handleSelectSlot = (
    info: SlotInfo & { resourceId?: string | number }
  ) => {
    const courtId = getSlotCourtId(info.resourceId);
    const start = getCalendarDateForSlot(info.start);
    const end = getReservationEndByCourt(start, courtId);
    const validationError = validateReservationDateTime({ courtId, start, end });

    if (validationError) {
      showUnavailableNotice(validationError);
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
    const validationError = validateReservationDateTime({ courtId, start, end });

    if (validationError) {
      setManualError(validationError);
      setIsErrorOpen(true);
      throw new Error(validationError);
    }

    setManualError(null);

    const saved = await createEvent({
      courtId,
      start,
      end,
      title,
      notes,
    });

    if (!saved) {
      setIsErrorOpen(true);
      throw new Error(createError ?? 'No se pudo crear la reserva');
    }

    setConfirmed((prev) => [
      ...prev,
      {
        id: String(saved.id),
        title: saved.title ?? title,
        start: new Date(saved.startTime ?? start),
        end: new Date(saved.endTime ?? end),
        resourceId: String(saved.courtId ?? courtId),
        estado: normalizeEstado(saved.status ?? 'confirmed'),
      } as CalendarEvent,
    ]);

    setIsOpen(false);
    setSlotStart(undefined);
    setSlotEnd(undefined);
    setSlotResourceId(undefined);
  };

  const handleSelectEvent = (ev: CalendarEvent) => {
    if (isBlockedEvent(ev)) {
      showUnavailableNotice('Este horario está bloqueado');
      return;
    }

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
    if (isBlockedEvent(selectedEvent)) return;

    const normalizedEstado = normalizeEstado(selectedEvent.estado);
    if (!CANCELABLE_STATES.has(normalizedEstado)) return;

    setEventToCancel(selectedEvent);
    setIsCancelOpen(true);
    setIsInfoOpen(false);
  };

  const currentActiveView = activeView ?? internalActiveView;

  const handleBookingViewChange = (nextView: BookingAdminViewMode) => {
    setInternalActiveView(nextView);
    onViewChange?.(nextView);
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
        <header className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold">Calendario de reservas</h1>
            <p className="text-xs text-zinc-500">
              {currentActiveView === 'calendar'
                ? formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
                : 'Listado de reservas registradas.'}
            </p>

            {currentActiveView === 'calendar' ? (
              <div className="mt-2">
                <StatusLegend />
              </div>
            ) : null}
          </div>

          <BookingViewSwitcher
            activeView={currentActiveView}
            onViewChange={handleBookingViewChange}
          />
        </header>

        {currentActiveView === 'list' ? (
          <div className="flex-1 overflow-auto p-4">
            <AdminReservationsRangeList />
          </div>
        ) : (
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
                  onView={(nextView) => setView(nextView)}
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
                    const resourceId = getSlotCourtId(
                      (range as { resourceId?: string | number }).resourceId,
                    );
                    const start = getCalendarDateForSlot(range.start);
                    const end = getReservationEndByCourt(start, resourceId);

                    return !validateReservationDateTime({
                      courtId: resourceId,
                      start,
                      end,
                    });
                  }}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  dayPropGetter={() => ({
                    style: {
                      backgroundColor: '#ffffff',
                    },
                  })}
                  slotPropGetter={(slotDate, resourceId) => {
                    const slotStart = getCalendarDateForSlot(slotDate);
                    const isFutureSlot =
                      isSameOrAfterToday(slotStart) &&
                      isSameOrAfterCurrentBusinessMinute(slotStart);

                    if (resourceId === undefined || resourceId === null) {
                      return {
                        style: {
                          backgroundColor: isFutureSlot ? '#ffffff' : '#f3f4f6',
                          opacity: 1,
                        },
                        className: isFutureSlot ? '' : 'cursor-not-allowed',
                      };
                    }

                    const courtId = String(resourceId);
                    const allowed =
                      isFutureSlot && isAllowedTimeForCourt(slotStart, courtId);

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
        )}
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
          !isBlockedEvent(selectedEvent) &&
          CANCELABLE_STATES.has(normalizeEstado(selectedEvent.estado))
        }
        onClose={() => {
          setIsInfoOpen(false);
          setSelectedEvent(null);
        }}
        onDelete={handleAskDeleteFromInfo}
        onPaymentConfirmed={(bookingId, payload) => {
          setPaymentOverrides((prev) => ({
            ...prev,
            [bookingId]: {
              paymentMethod: payload.paymentMethod,
              paymentStatus: payload.paymentStatus,
              paidAt: payload.paidAt,
              paymentConfirmedBy: payload.paymentConfirmedBy ?? null,
            },
          }));

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
        message={manualError ?? createError ?? 'Horario no disponible'}
        onClose={() => {
          setIsErrorOpen(false);
          setManualError(null);
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