import { getCourtEvents } from "@/features/court/services/bookingApi";
import { useCourtSchedule } from "@/features/court/store/courtScheduleStore";

export function useFetchCourtEvents() {
  const setEventsByCourt = useCourtSchedule((state) => state.setEventsByCourt);

  const fetchEvents = async (courtId: string, startStr: string, startEnd: string) => {
    try {
      const data = await getCourtEvents(courtId,startStr,startEnd);
      console.log('useFetchCourtEvents '+data);
      setEventsByCourt(courtId, data);
    } catch (error) {
      console.error("Error fetching court events:", error);
    }
  };

  return { fetchEvents };
}
