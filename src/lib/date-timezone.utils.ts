const DEFAULT_TIME_ZONE = 'America/Santiago';

export type LocalDateParts = {
  ymd: string;
  hhmm: string;
  minutes: number;
};

function assertValidDate(date: Date): void {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida.');
  }
}

export function getLocalPartsFromDate(
  value: Date | string,
  timeZone = DEFAULT_TIME_ZONE,
): LocalDateParts {
  const date = value instanceof Date ? value : new Date(value);

  assertValidDate(date);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  const hour = Number(values.hour);
  const minute = Number(values.minute);

  return {
    ymd: `${values.year}-${values.month}-${values.day}`,
    hhmm: `${values.hour}:${values.minute}`,
    minutes: hour * 60 + minute,
  };
}

export function getBookingYmdFromDate(
  value: Date | string,
  timeZone = DEFAULT_TIME_ZONE,
): string {
  return getLocalPartsFromDate(value, timeZone).ymd;
}

export function toIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  assertValidDate(date);

  return date.toISOString();
}

export function validateDateRange(start: Date | string, end: Date | string): void {
  const startDate = start instanceof Date ? start : new Date(start);
  const endDate = end instanceof Date ? end : new Date(end);

  assertValidDate(startDate);
  assertValidDate(endDate);

  if (endDate <= startDate) {
    throw new Error('La hora de término debe ser posterior a la hora de inicio.');
  }
}

export function isPastDate(value: Date | string): boolean {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  return date.getTime() < Date.now();
}
