import {
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
  compareAsc,
  setHours,
  setMinutes,
} from 'date-fns';
import { CourtApi, CourtDTO, BookingDTO, CalendarDayResponse } from './types';

const MAX_COURTS = 10;
const RAW_COUNT = Number(process.env.NEXT_PUBLIC_MOCK_COURT_COUNT ?? 10);
const COURT_COUNT = Math.min(Math.max(1, RAW_COUNT), MAX_COURTS);

function makeCourts(n: number): CourtDTO[] {
  const count = Math.min(n, MAX_COURTS);

  return Array.from({ length: count }, (_, i) => ({
    id: `c${i + 1}`,
    title: `Cancha Pádel ${i + 1}`,
    type: 'padel',
  }));
}

function seedFromDate(d: Date): number {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return y * 10000 + m * 100 + day;
}

function prob(seed: number, k: number): number {
  const x = Math.sin(seed * 1.234 + k * 7.89) * 43758.5453;
  return x - Math.floor(x);
}

const BLOCKS = [
  { h: 17, m: 0, dur: 60, status: 'confirmado' as const },
  { h: 18, m: 0, dur: 90, status: 'reservado' as const },
  { h: 19, m: 30, dur: 90, status: 'reservado' as const },
  { h: 21, m: 0, dur: 90, status: 'reservado' as const },
];

function makePhoneNumber(courtIndex: number, blockIndex: number): string {
  return `569900${String(courtIndex).padStart(2, '0')}${String(blockIndex).padStart(2, '0')}`;
}

function getBookingsForDay(date: Date, courts: CourtDTO[]): BookingDTO[] {
  const seed = seedFromDate(date);
  const dayStart = startOfDay(date);
  const res: BookingDTO[] = [];
  let id = 1;

  courts.forEach((court, courtIndex) => {
    BLOCKS.forEach((block, blockIndex) => {
      if (prob(seed, courtIndex * 100 + blockIndex) > 0.4) {
        const start = setMinutes(setHours(dayStart, block.h), block.m);
        const end = new Date(start.getTime() + block.dur * 60 * 1000);

        res.push({
          id: String(id++),
          courtId: court.id,
          phoneNumber: makePhoneNumber(courtIndex + 1, blockIndex + 1),
          title: block.status === 'confirmado' ? 'Confirmado' : 'Reserva',
          status: block.status,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        });
      }
    });
  });

  return res.sort((a, b) => compareAsc(new Date(a.startTime), new Date(b.startTime)));
}

export const mockClient: CourtApi = {
  async listCourts(): Promise<CourtDTO[]> {
    return makeCourts(COURT_COUNT);
  },

  async listBookingsByDay({
    date,
    courtIds,
  }: {
    date: Date;
    courtIds?: string[];
  }): Promise<BookingDTO[]> {
    const courts = makeCourts(COURT_COUNT);
    const all = getBookingsForDay(date, courts);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    const okCourt = (courtId: string): boolean =>
      !courtIds?.length || courtIds.includes(courtId);

    const inDay = (booking: BookingDTO): boolean => {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return isBefore(start, dayEnd) && isAfter(end, dayStart);
    };

    return all.filter((booking) => okCourt(booking.courtId)).filter(inDay);
  },

  async listCalendarDay({
    date,
  }: {
    date: Date;
  }): Promise<CalendarDayResponse> {
    const courts = makeCourts(COURT_COUNT);
    const bookings = getBookingsForDay(date, courts);
    return { courts, bookings };
  },
};
