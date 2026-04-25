import { useCallback, useState } from 'react';
import { useFetchCourtEvents } from '@/features/court/hooks/useFetchCourtEvents';
import { useCourtSchedule } from '@/features/court/store/courtScheduleStore';
import type { Booking } from '@/features/court/types/booking';

export function useCourtEvents(courtId: string) {
  const { fetchEvents } = useFetchCourtEvents();
  const events = useCourtSchedule((state) => state.eventsByCourt[courtId] ?? []);
  const setEventsByCourt = useCourtSchedule((state) => state.setEventsByCourt);
  const [loading, setLoading] = useState(false);

  const loadEvents = useCallback(
    async (startStr: string, endStr: string): Promise<Booking[]> => {
      setLoading(true);

      try {
        const nextEvents = await fetchEvents({ courtId, startStr, endStr });
        setEventsByCourt(courtId, nextEvents);
        return nextEvents;
      } finally {
        setLoading(false);
      }
    },
    [courtId, fetchEvents, setEventsByCourt],
  );

  return {
    events,
    loading,
    loadEvents,
  };
}
