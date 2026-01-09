// src/lib/auth.service.ts
'use client';

export function getTokenClient(): string | null {
  if (typeof document === 'undefined') return null;

  const value = document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token='));

  return value ? value.split('=')[1] : null;
}
