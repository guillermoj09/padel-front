export function normalizeCourtType(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function isPadelType(value?: string | null) {
  const type = normalizeCourtType(value);
  return type.includes('padel');
}

export function isFutbolType(value?: string | null) {
  const type = normalizeCourtType(value);

  return (
    type.includes('futbol') ||
    type.includes('football') ||
    type.includes('soccer')
  );
}
