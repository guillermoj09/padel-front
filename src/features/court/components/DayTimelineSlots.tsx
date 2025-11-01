import { useMemo } from 'react';
import { addMinutes, format, set } from 'date-fns';

type Booking = { id: string; courtId: string; start: string; end: string };

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

function buildDate(base: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  return set(base, { hours: h, minutes: m, seconds: 0, milliseconds: 0 });
}

export default function DayTimelineSlots({
  date,
  bookings,
  onPick,
  startHour = 7,
  endHour = 23,
  stepMinutes = 60,
  defaultDuration = 60,
}: {
  date: Date;
  bookings: Booking[];
  onPick: (time: string /* 'HH:mm' */, duration: number) => void;
  startHour?: number;
  endHour?: number;
  stepMinutes?: number;
  defaultDuration?: number;
}) {
  const slots = useMemo(() => {
    const out: { t: string; busy: boolean }[] = [];
    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += stepMinutes) {
        const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const s = buildDate(date, t);
        const e = addMinutes(s, defaultDuration);
        const busy = bookings.some(b => {
          const bs = new Date(b.start);
          const be = new Date(b.end);
          return overlaps(s, e, bs, be);
        });
        out.push({ t, busy });
      }
    }
    return out;
  }, [date, bookings, startHour, endHour, stepMinutes, defaultDuration]);

  return (
    <div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 6 }}>
        Clic en una hora para crear (duración por defecto {defaultDuration} min)
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
        {slots.map(({ t, busy }) => (
          <button
            key={t}
            disabled={busy}
            onClick={() => onPick(t, defaultDuration)}
            title={busy ? 'Ocupado' : `Crear a las ${t}`}
            style={{
              padding: '8px 10px',
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              background: busy ? '#f3f4f6' : '#fff',
              color: busy ? '#9ca3af' : '#111827',
              cursor: busy ? 'not-allowed' : 'pointer',
              textAlign: 'left',
              fontSize: 13,
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
