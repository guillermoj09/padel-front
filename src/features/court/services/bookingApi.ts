// src/data/datasources/courtEventsApi.ts
import { mockCourtEvents } from '../mocks/court/courtEvent.mock';
import { USE_MOCKS } from '@/config/env';
import { Booking } from '../types/booking';




export async function getCourtEvents(
  courtId: string,
  start: string,
  end: string
): Promise<Booking[]> {
  if (USE_MOCKS) {
    console.log('[MOCK] getCourtEvents', courtId, start, end)
    return mockCourtEvents[courtId] || []
  }

  const url = `http://localhost:3002/bookings/court/${courtId}/events` +
              `?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`

  //console.log('Fetching events from', url)
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    console.error('Error fetching court events:', res.status, text)
    throw new Error(`Error fetching events (${res.status})`)
  }

  const data: Booking[] = await res.json()
  //console.log('Received bookings:', data)
  return data
}

export async function createBooking(courtId: string, booking: Booking): Promise<Booking> {
  console.log("entra ?");
  
  if (USE_MOCKS) {
    // Simular delay de red
    await new Promise((r) => setTimeout(r, 300));
    mockCourtEvents[courtId] = [...(mockCourtEvents[courtId] || []), booking];
    return booking;
  }
  console.log(` booking antes ${booking.endTime}`)
  const body = {
    userId: 'b2a8536d-7d7d-4c87-93ae-1813b1651000',  // ID de usuario, reemplázalo si es dinámico
    courtId: Number(courtId),  // Convierte courtId a número si es necesario
    startTime: booking.startTime,
    endTime: booking.endTime,
    date: booking.startTime.split('T')[0],  // Extraer la fecha del campo start
    status: 'pendiente',  // Establecer estado
  };
  console.log(body);
  const res = await fetch(`http://localhost:3002/bookings`, {  // Cambiar la ruta a /bookings
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) throw new Error('Error creating booking');
  return res.json();
}

