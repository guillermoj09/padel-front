import { mockCourtEvents } from '../mocks/court/courtEvent.mock';
import { USE_MOCKS } from '@/config/env';
import { apiFetch } from '@/lib/api';
import type { Booking } from '../types/booking';
import type { PaymentMethod } from '../hooks/useCalendarDay';

export async function getCourtEvents(
  courtId: string,
  start: string,
  end: string
): Promise<Booking[]> {
  if (USE_MOCKS) {
    return mockCourtEvents[courtId] || [];
  }

  const params = new URLSearchParams({ start, end }).toString();
  return apiFetch<Booking[]>(
    `/bookings/court/${encodeURIComponent(courtId)}/events?${params}`,
    { noStore: true }
  );
}

export async function createBooking(booking: {
  courtId: number;
  startTime: string;
  endTime: string;
  title?: string;
  notes?: string;
}): Promise<Booking> {
  if (USE_MOCKS) {
    await new Promise((r) => setTimeout(r, 300));
    const mockBooking: Booking = {
      id: crypto.randomUUID(),
      userId: '',
      courtId: booking.courtId,
      paymentId: null,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: 'confirmed',
      date: booking.startTime.slice(0, 10),
      title: booking.title ?? 'Reserva',
    };
    const key = String(booking.courtId);
    mockCourtEvents[key] = [...(mockCourtEvents[key] || []), mockBooking];
    return mockBooking;
  }

  const body = {
    courtId: Number(booking.courtId),
    startTime: booking.startTime,
    endTime: booking.endTime,
    title: booking.title,
  };

  return apiFetch<Booking>('/bookings', {
    method: 'POST',
    jsonBody: body,
  });
}

export async function cancelBooking(
  bookingId: string,
  opts?: { reason?: string }
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

export async function confirmBookingPayment(
  bookingId: string,
  paymentMethod: Exclude<PaymentMethod, 'pendiente'>,
): Promise<{
  id: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid';
  paidAt: string | null;
  paymentConfirmedBy?: string | null;
}> {
  return apiFetch(`/bookings/${bookingId}/confirm-payment`, {
    method: 'PATCH',
    jsonBody: { paymentMethod },
  });
}
