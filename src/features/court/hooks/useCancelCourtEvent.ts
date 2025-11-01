'use client';

import { useState, useCallback } from 'react';
import { cancelBooking } from '@/features/court/services/bookingApi';

type CancelPayload = {
  id: string;
  reason?: string;
};

export function useCancelCourtEvent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelEvent = useCallback(async ({ id, reason }: CancelPayload) => {
    setLoading(true);
    setError(null);
    try {
      await cancelBooking(id, { reason });
      return true;
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo cancelar');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const resetError = () => setError(null);

  return { cancelEvent, loading, error, resetError };
}
