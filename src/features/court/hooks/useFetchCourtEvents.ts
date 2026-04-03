import { getCourtEvents } from '@/features/court/services/bookingApi';
import type { Booking } from '../types/booking';

type FetchCourtEventsParams = {
  courtId: string;
  startStr: string;
  endStr: string;
};

export function useFetchCourtEvents() {
  const fetchEvents = async ({
    courtId,
    startStr,
    endStr,
  }: FetchCourtEventsParams): Promise<Booking[]> => {
    try {
      const booking = await getCourtEvents(courtId, startStr, endStr);
      return booking;
    } catch (error) {
      console.error('Error fetching court events:', error);
      return [];
    }
  };

  return { fetchEvents };
}
