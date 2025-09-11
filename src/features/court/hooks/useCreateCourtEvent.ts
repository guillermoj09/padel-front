// src/hooks/useEvent.ts
import { useState } from 'react';
import { getCourtEvents, createBooking } from '@/features/court/services/bookingApi';  // Importar las funciones
import { Booking } from '../types/booking';

export const useCreateCourtEvent = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtener los eventos de la cancha
  const fetchEvents = async (courtId: string) => {
    setLoading(true);
    setError(null);

    try {
      const events = await getCourtEvents(courtId);  // Llamada a la API para obtener eventos
      return events;
    } catch (err) {
      setError('Error al obtener eventos');
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Guardar la reserva en el backend
  const saveEventToBackend = async (courtId: string, booking: Booking) => {
    setLoading(true);
    setError(null);
    
    try {
      const savedBooking = await createBooking(courtId, booking);  // Llamada a la API para crear la reserva
      return savedBooking;
    } catch (err) {
      setError('Error al crear la reserva');
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { fetchEvents, saveEventToBackend, loading, error };
};
