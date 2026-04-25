// src/hooks/useCreateCourtEvent.ts
import { useCallback, useState } from 'react';
import { createBooking } from '@/features/court/services/bookingApi';
import type { Booking } from '@/features/court/types/booking';
import { getErrorMessage, getErrorStatus } from '@/lib/errors';

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
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        title,
        notes,
      };

      const saved = await createBooking(payload);
      return saved as Booking;
    } catch (error: unknown) {
      const status = getErrorStatus(error);
      if (status === 409) {
        setError(getErrorMessage(error, 'La reserva se superpone con otra existente.'));
      } else {
        setError(getErrorMessage(error, 'Error al crear la reserva.'));
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createEvent, loading, error, resetError };
};
