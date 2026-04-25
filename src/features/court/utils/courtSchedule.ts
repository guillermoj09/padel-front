import { isFutbolType, isPadelType } from './courtTypes';

export type AllowedSlot = {
  h: number;
  m: number;
};

export type CourtLike = {
  id: string | number;
  type?: string | null;
};

export const PADEL_ALLOWED_SLOTS: AllowedSlot[] = [
  { h: 7, m: 0 },
  { h: 8, m: 30 },
  { h: 10, m: 0 },
  { h: 11, m: 30 },
  { h: 17, m: 0 },
  { h: 18, m: 30 },
  { h: 20, m: 0 },
  { h: 21, m: 30 },
];

export const FUTBOL_ALLOWED_SLOTS: AllowedSlot[] = [
  { h: 7, m: 0 },
  { h: 8, m: 0 },
  { h: 9, m: 0 },
  { h: 10, m: 0 },
  { h: 11, m: 0 },
  { h: 12, m: 0 },
  { h: 17, m: 0 },
  { h: 18, m: 0 },
  { h: 19, m: 0 },
  { h: 20, m: 0 },
  { h: 21, m: 0 },
  { h: 22, m: 0 },
];

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function getCourtById<T extends CourtLike>(
  courts: T[],
  courtId?: string | number
) {
  return courts.find((court) => String(court.id) === String(courtId));
}

export function getReservationMinutesByCourt<T extends CourtLike>(
  courts: T[],
  courtId?: string | number
) {
  const court = getCourtById(courts, courtId);
  const type = court?.type;

  if (isFutbolType(type)) return 60;
  if (isPadelType(type)) return 90;

  return 90;
}

export function getAllowedSlotsByCourt<T extends CourtLike>(
  courts: T[],
  courtId?: string | number
) {
  const court = getCourtById(courts, courtId);
  const type = court?.type;

  if (isFutbolType(type)) return FUTBOL_ALLOWED_SLOTS;
  if (isPadelType(type)) return PADEL_ALLOWED_SLOTS;

  return PADEL_ALLOWED_SLOTS;
}

export function isAllowedTimeForCourt<T extends CourtLike>(
  date: Date,
  courts: T[],
  courtId?: string | number
) {
  const h = date.getHours();
  const m = date.getMinutes();

  const allowedSlots = getAllowedSlotsByCourt(courts, courtId);

  return allowedSlots.some((slot) => slot.h === h && slot.m === m);
}

export function getBlockedSlotMessage<T extends CourtLike>(
  slotDate: Date,
  courts: T[],
  courtId?: string | number,
  isSameOrAfterToday?: (date: Date) => boolean
) {
  if (isSameOrAfterToday && !isSameOrAfterToday(slotDate)) {
    return 'No puedes reservar en días pasados';
  }

  const court = getCourtById(courts, courtId);
  const type = court?.type;

  if (isFutbolType(type)) {
    return 'Horario no disponible. Fútbol solo permite bloques de 1 hora en horarios exactos.';
  }

  if (isPadelType(type)) {
    return 'Horario no disponible. Pádel solo permite bloques de 1 hora y media.';
  }

  return 'Este horario no está disponible para reservar';
}
