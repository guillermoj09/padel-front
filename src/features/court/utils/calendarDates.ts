export const SAFE_INITIAL_DATE = new Date(2000, 0, 1);

export function todayInTimeZone(tz: string) {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('es-CL', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value) - 1;
  const day = Number(parts.find((part) => part.type === 'day')?.value);

  return new Date(year, month, day);
}

export function isSameOrAfterDate(date: Date, limitDate: Date) {
  const cmp = new Date(date);
  cmp.setHours(0, 0, 0, 0);

  const limit = new Date(limitDate);
  limit.setHours(0, 0, 0, 0);

  return cmp >= limit;
}
