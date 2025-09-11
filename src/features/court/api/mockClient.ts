import { startOfDay, endOfDay, isBefore, isAfter, compareAsc, setHours, setMinutes } from 'date-fns';
import { CourtApi, CourtDTO, BookingDTO, CalendarDayResponse } from './types';

// ✅ Máximo 10 canchas siempre
const MAX_COURTS = 10;
const RAW_COUNT = Number(process.env.NEXT_PUBLIC_MOCK_COURT_COUNT ?? 10);
const COURT_COUNT = Math.min(Math.max(1, RAW_COUNT), MAX_COURTS);

function makeCourts(n: number): CourtDTO[] {
  const count = Math.min(n, MAX_COURTS);
  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    title: `Cancha Pádel ${i + 1}`,
  }));
}

// PRNG determinista simple por fecha
function seedFromDate(d: Date) {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  return y * 10000 + m * 100 + day;
}
function prob(seed: number, k: number) {
  const x = Math.sin(seed * 1.234 + k * 7.89) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

const BLOCKS = [
  { h: 17, m: 0,  dur: 60, status: 'confirmado' as const },
  { h: 18, m: 0,  dur: 90, status: 'reservado'  as const },
  { h: 19, m: 30, dur: 90, status: 'reservado'  as const },
  { h: 21, m: 0,  dur: 90, status: 'reservado'  as const },
];

function genBookingsForDay(date: Date, courts: CourtDTO[]): BookingDTO[] {
  const seed = seedFromDate(date);
  const dayStart = startOfDay(date);
  const res: BookingDTO[] = [];
  let id = 1;

  courts.forEach((c, ci) => {
    BLOCKS.forEach((b, bi) => {
      if (prob(seed, ci * 100 + bi) > 0.4) { // ~60% de ocupación por bloque
        const s = setMinutes(setHours(dayStart, b.h), b.m);
        const e = new Date(s.getTime() + b.dur * 60 * 1000);
        res.push({
          id: String(id++),
          courtId: c.id,
          title: b.status === 'confirmado' ? 'Confirmado' : 'Reserva',
          status: b.status,
          startTime: s.toISOString(),
          endTime: e.toISOString(),
        });
      }
    });
  });

  return res.sort((a, b) => compareAsc(new Date(a.startTime), new Date(b.startTime)));
}

export const mockClient: CourtApi = {
  async listCourts() {
    return makeCourts(COURT_COUNT);
  },

  async listBookingsByDay({ date, courtIds }) {
    const courts = makeCourts(COURT_COUNT);
    const all = genBookingsForDay(date, courts);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const okCourt = (cid: string) => !courtIds?.length || courtIds.includes(cid);
    const inDay = (b: BookingDTO) => {
      const s = new Date(b.startTime), e = new Date(b.endTime);
      return isBefore(s, dayEnd) && isAfter(e, dayStart);
    };
    return all.filter(b => okCourt(b.courtId)).filter(inDay);
  },

  async listCalendarDay({ date }): Promise<CalendarDayResponse> {
    // 🔹 Un solo “endpoint”: canchas + reservas del día
    const courts = makeCourts(COURT_COUNT);
    const bookings = genBookingsForDay(date, courts);
    return { courts, bookings };
  },
};
