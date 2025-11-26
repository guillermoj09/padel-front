// src/hooks/useCreateCourtEvent.ts
import { useCallback, useState } from 'react';
import { createBooking } from '@/features/court/services/bookingApi';
import type { Booking } from '@/features/court/types/booking';

/**
 * Parámetros para crear una reserva.
 * Usa Date en local; el hook normaliza a ISO UTC para el backend.
 */
export type CreateEventParams = {
  courtId: string | number;
  start: Date;
  end: Date;
  title?: string;
  notes?: string;
};

export type UseCreateCourtEventReturn = {
  createEvent: (params: CreateEventParams) => Promise<Booking | null>;
  loading: boolean;
  error: string | null;
  resetError: () => void;
};

/**
 * Hook minimalista para CREAR reservas de cancha.
 * No trae eventos; solo realiza el POST y expone loading/error.
 */
export const useCreateCourtEvent = (): UseCreateCourtEventReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetError = useCallback(() => setError(null), []);

  const createEvent = useCallback(async (params: CreateEventParams) => {
    const { courtId, start, end, title, notes } = params;
    setLoading(true);
    setError(null);
    try {
      const payload = {
        courtId: Number(courtId),
        startTime: start.toISOString(), // normaliza a ISO (UTC)
        endTime: end.toISOString(),
        title,
        notes,
      };
      console.log(`payload ${payload}`)
      // Ajusta si tu API espera otra firma
      const saved = await createBooking(payload);
      return saved as Booking;
    } catch (e: any) {
      // Si tu API devuelve 409 en solapes, puedes mapear un mensaje claro:
      const status = e?.status ?? e?.response?.status;
      if (status === 409) {
        setError('Ya existe una reserva que se superpone con ese horario.');
      } else {
        setError(e?.message || 'Error al crear la reserva.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createEvent, loading, error, resetError };
};
