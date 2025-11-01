// src/data/datasources/courtEventsApi.ts
import { mockCourtEvents } from '../mocks/court/courtEvent.mock';
import { USE_MOCKS } from '@/config/env';
import { Booking } from '../types/booking';
import { apiFetch } from '@/lib/api';     // <- sin "auth"

export async function getCourtEvents(
  courtId: string,
  start: string,
  end: string
): Promise<Booking[]> {
  if (USE_MOCKS) {
    console.log('[MOCK] getCourtEvents', courtId, start, end);
    return mockCourtEvents[courtId] || [];
  }

  const params = new URLSearchParams({ start, end }).toString();
  return apiFetch<Booking[]>(
    `/bookings/court/${encodeURIComponent(courtId)}/events?${params}`,
    { noStore: true } // fuerza fresh si quieres
  );
}

export async function createBooking(booking: Booking): Promise<Booking> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    mockCourtEvents[courtId] = [...(mockCourtEvents[courtId] || []), booking];
    return booking;
  }
  console.log('entro');

  // NO mandamos userId. El backend debe usar req.user.id desde la cookie/JWT.
  const body = {
    courtId: Number(booking.courtId),
    startTime: booking.startTime,
    endTime: booking.endTime,
    //date: booking.startTime.split('T')[0],
    //status: 'pendiente',
  };
  console.log(body);
  return apiFetch<Booking>('/bookings', {
    method: 'POST',
    jsonBody: body, // <- usa jsonBody, no body: JSON.stringify(...)
  });
}

export async function cancelBooking(
  bookingId: string,
  opts?: { reason?: string; }
): Promise<{ success: true }> {
  const { reason } = opts || {};

  await apiFetch(`/bookings/${bookingId}/cancel`, {
    method: 'PATCH',
    jsonBody: {
      ...(reason ? { reason } : {}),
    },
  });

  return { success: true };
}
