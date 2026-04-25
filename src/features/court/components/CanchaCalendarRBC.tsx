'use client';

import React, {
  useMemo,
  useState,
  useEffect,
  type ReactElement,
} from 'react';
import {
  Calendar as RBCalendar,
  Views,
  dateFnsLocalizer,
  type SlotInfo,
} from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';

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
import { CourtCalendarSidebar } from '@/features/court/components/CourtCalendarSidebar';

import {
  SAFE_INITIAL_DATE,
  isSameOrAfterDate,
  todayInTimeZone,
} from '@/features/court/utils/calendarDates';
import { eventPropGetter } from '@/features/court/utils/calendarEventStyle';
import {
  addMinutes,
  getBlockedSlotMessage,
  getCourtById,
  getReservationMinutesByCourt,
  isAllowedTimeForCourt,
} from '@/features/court/utils/courtSchedule';
import {
  CANCELABLE_STATES,
  normalizeEstado,
} from '@/features/court/utils/courtStatus';

const locales = { es };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

type Props = {
  dataSource?: DataSource;
};

type TimeSlotWrapperProps = {
  value?: Date;
  resource?: string | number;
  children?: ReactElement<any>;
};

export default function CanchaCalendarRBC({ dataSource }: Props) {
  const [mounted, setMounted] = useState(false);
  const [fechaInicial, setFechaInicial] = useState<Date>(SAFE_INITIAL_DATE);
  const [view, setView] = useState(Views.DAY);
  const [date, setDate] = useState<Date>(SAFE_INITIAL_DATE);

  const [selected, setSelected] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [confirmed, setConfirmed] = useState<CalendarEvent[]>([]);
  const [canceledIds, setCanceledIds] = useState<Set<string>>(new Set());

  const [isOpen, setIsOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>();
  const [slotEnd, setSlotEnd] = useState<Date | undefined>();
  const [slotResourceId, setSlotResourceId] = useState<string | undefined>();

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<CalendarEvent | null>(null);

  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const [slotTooltip, setSlotTooltip] = useState<{
    visible: boolean;
    text: string;
    x: number;
    y: number;
  } | null>(null);

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

  const { cancelEvent, loading: canceling } = useCancelCourtEvent();

  useEffect(() => {
    const today = todayInTimeZone('America/Santiago');

    setFechaInicial(today);
    setDate(today);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!bootstrapped && courts.length) {
      setSelected(courts.slice(0, 3).map((court) => String(court.id)));
      setBootstrapped(true);
    }
  }, [courts, bootstrapped]);

  useEffect(() => {
    setConfirmed((prev) =>
      prev.filter(
        (confirmedEvent) =>
          !eventsAll.some(
            (backendEvent) =>
              String(backendEvent.id) === String(confirmedEvent.id)
          )
      )
    );
  }, [eventsAll]);

  const resources = useMemo(
    () =>
      courts
        .filter((court) => selected.includes(String(court.id)))
        .map((court) => ({
          ...court,
          title: `${court.type} - ${court.title}`,
        })),
    [courts, selected]
  );

  const events = useMemo(() => {
    const shouldShowEvent = (event: CalendarEvent) =>
      !canceledIds.has(String(event.id)) &&
      selected.includes(String(event.resourceId));

    return [
      ...eventsAll.filter(shouldShowEvent),
      ...confirmed.filter(shouldShowEvent),
    ];
  }, [eventsAll, confirmed, canceledIds, selected]);

  const minWidthPx = useMemo(
    () => Math.max(900, resources.length * 220),
    [resources.length]
  );

  const isSameOrAfterToday = (value: Date) =>
    isSameOrAfterDate(value, fechaInicial);

  const closeReserveModal = () => {
    setIsOpen(false);
    setSlotStart(undefined);
    setSlotEnd(undefined);
    setSlotResourceId(undefined);
  };

  const toggleCourt = (courtId: string) => {
    setSelected((prev) =>
      prev.includes(courtId)
        ? prev.filter((id) => id !== courtId)
        : [...prev, courtId]
    );
  };

  const TimeSlotWrapper = ({
    value,
    resource,
    children,
  }: TimeSlotWrapperProps) => {
    if (!children || !value) return children ?? null;

    const courtId =
      resource !== undefined && resource !== null ? String(resource) : undefined;

    if (!courtId) return children;

    const allowed =
      isSameOrAfterToday(value) &&
      isAllowedTimeForCourt(value, courts, courtId);

    const message = allowed
      ? 'Horario disponible'
      : getBlockedSlotMessage(value, courts, courtId, isSameOrAfterToday);

    const prevClassName = children.props?.className ?? '';
    const extraClassName = allowed
      ? 'hover:bg-blue-50'
      : 'bg-gray-100 opacity-40 cursor-not-allowed';

    const showTooltipAtMouse = (clientX: number, clientY: number) => {
      if (!allowed) {
        setSlotTooltip({
          visible: true,
          text: message,
          x: clientX + 12,
          y: clientY + 12,
        });
      }
    };

    const hideTooltip = () => {
      setSlotTooltip(null);
    };

    return (
      <div
        className="h-full w-full"
        onMouseEnter={(event) => {
          showTooltipAtMouse(event.clientX, event.clientY);
        }}
        onMouseMove={(event) => {
          if (!allowed) {
            setSlotTooltip((prev) =>
              prev
                ? {
                    ...prev,
                    x: event.clientX + 12,
                    y: event.clientY + 12,
                  }
                : {
                    visible: true,
                    text: message,
                    x: event.clientX + 12,
                    y: event.clientY + 12,
                  }
            );
          }
        }}
        onMouseLeave={hideTooltip}
        onMouseDown={(event) => {
          if (!allowed) {
            event.preventDefault();
            event.stopPropagation();
            showTooltipAtMouse(event.clientX, event.clientY);
          }
        }}
        onClick={(event) => {
          if (!allowed) {
            event.preventDefault();
            event.stopPropagation();
            showTooltipAtMouse(event.clientX, event.clientY);
          }
        }}
        onTouchStart={(event) => {
          if (!allowed) {
            event.preventDefault();
            event.stopPropagation();

            const touch = event.touches[0];

            if (touch) {
              showTooltipAtMouse(touch.clientX, touch.clientY);
            }
          }
        }}
      >
        {React.cloneElement(children, {
          ...children.props,
          className: `${prevClassName} ${extraClassName}`.trim(),
        })}
      </div>
    );
  };

  const handleSelectSlot = (
    info: SlotInfo & { resourceId?: string | number }
  ) => {
    if (!isSameOrAfterToday(info.start)) return;

    const courtId = String(info.resourceId ?? resources?.[0]?.id ?? '');

    if (!courtId) return;

    if (!isAllowedTimeForCourt(info.start, courts, courtId)) return;

    const start = info.start;
    const durationMinutes = getReservationMinutesByCourt(courts, courtId);
    const end = addMinutes(start, durationMinutes);

    const closing = new Date(start);
    closing.setHours(23, 0, 0, 0);

    if (end > closing) return;

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

    closeReserveModal();
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsInfoOpen(true);
  };

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
      prev.filter((event) => String(event.id) !== String(eventToCancel.id))
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

  if (!mounted) {
    return (
      <div className="h-[80vh] font-[system-ui]">
        <div className="h-full rounded-2xl bg-white shadow-sm border border-zinc-200 flex items-center justify-center">
          <div className="text-sm text-zinc-500">Cargando calendario...</div>
        </div>
      </div>
    );
  }

  const formattedDate = format(date, "EEEE d 'de' MMMM yyyy", {
    locale: es,
  });

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
          <CourtCalendarSidebar
            date={date}
            minDate={fechaInicial}
            courts={courts}
            selected={selected}
            onDateChange={setDate}
            onSelectAll={() => {
              setSelected(courts.map((court) => String(court.id)));
            }}
            onClearSelection={() => {
              setSelected([]);
            }}
            onToggleCourt={toggleCourt}
          />

          <section className="h-full overflow-hidden rounded-xl border border-zinc-200 bg-white">
            <div className="h-full overflow-x-auto">
              <div style={{ minWidth: minWidthPx }}>
                <RBCalendar
                  localizer={localizer}
                  culture="es"
                  date={date}
                  onNavigate={(next) => {
                    setDate(next < fechaInicial ? fechaInicial : next);
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
                  components={{
                    timeSlotWrapper: TimeSlotWrapper,
                  }}
                  selectable
                  onSelecting={(range) => {
                    if (!isSameOrAfterToday(range.start)) return false;

                    const resourceId = String(
                      (range as { resourceId?: string | number }).resourceId ??
                        resources?.[0]?.id ??
                        ''
                    );

                    if (!resourceId) return false;

                    return isAllowedTimeForCourt(
                      range.start,
                      courts,
                      resourceId
                    );
                  }}
                  onSelectSlot={handleSelectSlot}
                  onSelectEvent={handleSelectEvent}
                  slotPropGetter={() => ({
                    className: 'bg-white',
                  })}
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
        onClose={closeReserveModal}
        onSave={handleSaveBooking}
        saving={savingEvent}
      />

      <ReservationInfoModal
        isOpen={isInfoOpen}
        event={selectedEvent}
        courtTitle={
          selectedEvent
            ? getCourtById(courts, selectedEvent.resourceId)?.title
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

      <ErrorModal
        isOpen={isErrorOpen}
        message={createError ?? 'Horario no disponible'}
        onClose={() => {
          setIsErrorOpen(false);
          resetCreateError();
        }}
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

      {slotTooltip?.visible && (
        <div
          className="fixed z-[9999] pointer-events-none max-w-xs rounded-lg bg-zinc-900 text-white text-xs px-3 py-2 shadow-xl"
          style={{
            left: slotTooltip.x,
            top: slotTooltip.y,
          }}
        >
          {slotTooltip.text}
        </div>
      )}
    </div>
  );
}
