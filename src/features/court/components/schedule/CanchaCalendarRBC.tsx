'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Calendar as RBCalendar, Views, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import es from 'date-fns/locale/es';
import Calendar from 'react-calendar';

import { useCalendarDay, type CalendarEvent } from '@/features/court/hooks/useCalendarDay';
import type { DataSource } from '@/features/court/api/types';

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

  const y = Number(parts.find(p => p.type === 'year')?.value);
  const m = Number(parts.find(p => p.type === 'month')?.value) - 1;
  const d = Number(parts.find(p => p.type === 'day')?.value);
  return new Date(y, m, d); // 00:00 local
}

const FECHA_INICIAL = todayInTimeZone('America/Santiago');

function eventPropGetter(event: CalendarEvent) {
  const style: React.CSSProperties = {
    borderRadius: 10, border: 'none', color: '#111827', fontWeight: 600,
  };
  if (event.estado === 'reservado')  style.backgroundColor = '#fecaca';
  if (event.estado === 'confirmado') style.backgroundColor = '#bbf7d0';
  return { style };
}


type Props = { dataSource?: DataSource }; // 'mock' | 'api'

export default function CanchaCalendarRBC({ dataSource }: Props) {
  const [view, setView] = useState(Views.DAY);
  const [date, setDate] = useState<Date>(FECHA_INICIAL);

  // 🔹 1 sola llamada por fecha: courts + bookings
  const { courts, eventsAll, loading, error } = useCalendarDay({ date, source: dataSource, maxCourts: 10 });

  // Selección inicial: primeras 3 para evitar 10 columnas de golpe
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (courts.length && selected.length === 0) {
      setSelected(courts.slice(0, 3).map(c => c.id));
    }
  }, [courts, selected.length]);

  const resources = useMemo(
    () => courts.filter(r => selected.includes(r.id)),
    [courts, selected]
  );

  const events = useMemo(
    () => eventsAll.filter(e => selected.includes(e.resourceId)),
    [eventsAll, selected]
  );

  const toggle = (id: string) => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // ancho mínimo para scroll horizontal si hay muchas columnas
  const minWidthPx = Math.max(900, resources.length * 220);

  return (
    <div style={{ height: '80vh', fontFamily: 'Inter, system-ui' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1rem', height: '100%' }}>
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

            {courts.map(r => (
              <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={selected.includes(r.id)}
                  onChange={() => toggle(r.id)}
                />
                {r.title}
              </label>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                onClick={() => setSelected(courts.map(r => r.id))}
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

            {/* Lista rápida del día */}
            <div style={{ marginTop: 12 }}>
              <div className="text-sm font-medium mb-1">Reservas del día</div>
              {!loading && events.length === 0 && <div className="text-xs text-gray-500">Sin reservas</div>}
              <ul className="text-xs text-gray-700 space-y-1">
                {events.map(ev => (
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
              style={{ height: '100%' }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
