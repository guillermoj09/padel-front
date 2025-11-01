'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Calendar as RBCalendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import Calendar from 'react-calendar';

import { useCalendarDay, type CalendarEvent } from '@/features/court/hooks/useCalendarDay';
import type { DataSource } from '@/features/court/api/types';
import { ReserveModal } from '@/features/court/components/ReserveModal';
import { useCreateCourtEvent } from '@/features/court/hooks/useCreateCourtEvent';
import { apiFetch } from '@/lib/api';
import { CancelModal } from '@/features/court/components/CancelModal'; // 👈 NUEVO
import { useCancelCourtEvent } from '@/features/court/hooks/useCancelCourtEvent'; // 👈 NUEVO


const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (d: Date) => startOfWeek(d, { weekStartsOn: 1 }),
  getDay,
  locales,
});

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

function eventPropGetter(event: CalendarEvent) {
  const style: React.CSSProperties = {
    borderRadius: 10,
    border: 'none',
    color: '#111827',
    fontWeight: 600,
  };
  const bg =
    event.estado === 'confirmado'
      ? '#bbf7d0'
      : event.estado === 'reservado'
        ? '#fecaca'
        : '#e5e7eb';
  return { style: { ...style, backgroundColor: bg } };
}

type Props = { dataSource?: DataSource };

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

  const [selected, setSelected] = useState<string[]>([]);
  const [bootstrapped, setBootstrapped] = useState(false);

  // reservas creadas desde el front
  const [confirmed, setConfirmed] = useState<CalendarEvent[]>([]);
  // ids cancelados para esconder
  const [canceledIds, setCanceledIds] = useState<Set<string>>(new Set());

  // modal de crear
  const [isOpen, setIsOpen] = useState(false);
  const [slotStart, setSlotStart] = useState<Date | undefined>(undefined);
  const [slotEnd, setSlotEnd] = useState<Date | undefined>(undefined);
  const [slotResourceId, setSlotResourceId] = useState<string | undefined>(undefined);

  // modal de cancelar
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [eventToCancel, setEventToCancel] = useState<CalendarEvent | null>(null);

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

  const events = useMemo(() => {
    const cancelFilter = (e: CalendarEvent) =>
      !canceledIds.has(String(e.id)) && selected.includes(e.resourceId);

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

  const minWidthPx = useMemo(
    () => Math.max(900, resources.length * 220),
    [resources.length]
  );

  const handleSelectSlot = (info: any) => {
    setSlotStart(info.start);
    setSlotEnd(info.end);
    const rid = info.resourceId ?? resources?.[0]?.id;
    setSlotResourceId(rid ? String(rid) : undefined);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSlotStart(undefined);
    setSlotEnd(undefined);
    setSlotResourceId(undefined);
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
          estado: saved.estado ?? saved.status ?? 'confirmado',
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

  // abrir modal de cancelar
  const handleSelectEvent = (ev: CalendarEvent) => {
    console.log(ev.estado);
    if (ev.estado !== 'pending') return;
    setEventToCancel(ev);
    setIsCancelOpen(true);
  };

  // confirmar en modal
  const handleConfirmCancel = async (reason?: string) => {
    if (!eventToCancel) return;

    const ok = await cancelEvent({
      id: String(eventToCancel.id),
      reason,
    });

    if (!ok) return;

    // quitar del front
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

  return (
    <div style={{ height: '80vh', fontFamily: 'Inter, system-ui' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr',
          gap: '1rem',
          height: '100%',
        }}
      >
        <aside>
          <Calendar
            locale="es"
            calendarType="iso8601"
            value={date}
            onChange={(d) => setDate(d as Date)}
            next2Label={null}
            prev2Label={null}
          />

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading && <div className="text-sm text-gray-500">Cargando…</div>}
            {error && <div className="text-sm text-red-700">Error: {error}</div>}

            {courts.map((r) => (
              <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggle(r.id)} />
                {r.title}
              </label>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setSelected(courts.map((r) => r.id))}
                style={{ padding: '4px 10px', borderRadius: 8 }}
                disabled={!courts.length}
              >
                Todas
              </button>
              <button
                onClick={() => setSelected([])}
                style={{ padding: '4px 10px', borderRadius: 8 }}
                disabled={!courts.length}
              >
                Ninguna
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div className="text-sm font-medium mb-1">Reservas del día</div>
              {!loading && events.length === 0 && (
                <div className="text-xs text-gray-500">Sin reservas</div>
              )}
              <ul className="text-xs text-gray-700 space-y-1">
                {events.map((ev) => (
                  <li key={ev.id}>
                    {format(ev.start, 'HH:mm')}–{format(ev.end, 'HH:mm')} · {ev.title} · {ev.resourceId}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <section style={{ height: '100%', overflowX: 'auto' }}>
          <div style={{ minWidth: minWidthPx }}>
            <RBCalendar
              localizer={localizer}
              culture="es"
              date={date}
              onNavigate={setDate}
              view={view}
              onView={setView}
              defaultView={Views.DAY}
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
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent} // 👈 click en evento → abre modal
              style={{ height: '100%' }}
            />
          </div>
        </section>
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
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: 16,
            background: 'rgba(17,24,39,0.9)',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: 12,
            fontSize: 12,
            boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
            zIndex: 50,
          }}
        >
          {canceling
            ? 'Cancelando…'
            : savingEvent
              ? 'Guardando…'
              : 'Cargando…'}
        </div>
      )}
    </div>
  );
}
