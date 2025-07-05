// src/data/datasources/courtEventsApi.ts
import { mockCourtEvents } from '../mocks/court/courtEvent.mock';
import { USE_MOCKS } from '@/config/env';
import { Booking } from '../types/booking';

export async function getCourtEvents(courtId: string,start: string, end: string): Promise<Booking[]> {
  if (USE_MOCKS) {
    console.log("entro")
    return mockCourtEvents[courtId] || [];
  }
  console.log("no entro")

  // ⚠️ Aquí va el fetch real a la API
  //console.log(`http://localhost:3002/bookings/court/${courtId}/events?start=${start}&end=${end}`)
  const res = await fetch(`http://localhost:3002/bookings/court/${courtId}/events?start=${start}&end=${end}`);
  //console.log('respuesta '+res.json());
  if (!res.ok) throw new Error('Error fetching events');
  return res.json();
}

export async function createBooking(courtId: string, booking: Booking): Promise<Booking> {
  console.log("entra ?");
  
  if (USE_MOCKS) {
    // Simular delay de red
    await new Promise((r) => setTimeout(r, 300));
    mockCourtEvents[courtId] = [...(mockCourtEvents[courtId] || []), booking];
    return booking;
  }
  console.log(courtId)
  const body = {
    userId: 'b2a8536d-7d7d-4c87-93ae-1813b1651000',  // ID de usuario, reemplázalo si es dinámico
    courtId: Number(courtId),  // Convierte courtId a número si es necesario
    startTime: booking.start,
    endTime: booking.end,
    date: booking.start.split('T')[0],  // Extraer la fecha del campo start
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

