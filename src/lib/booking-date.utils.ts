export function toIsoDateString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error('Fecha inválida.');
  }

  return date.toISOString();
}

export function validateBookingDates(start: string, end: string): void {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (Number.isNaN(startDate.getTime())) {
    throw new Error('La fecha de inicio no es válida.');
  }

  if (Number.isNaN(endDate.getTime())) {
    throw new Error('La fecha de término no es válida.');
  }

  if (endDate <= startDate) {
    throw new Error('La fecha de término debe ser posterior a la fecha de inicio.');
  }
}

export function isPastDate(value: Date | string): boolean {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return true;
  }

  return date.getTime() < Date.now();
}
