import { getCourtEvents } from "@/features/court/services/bookingApi";
import { useCourtSchedule } from "@/features/court/store/courtScheduleStore";
import { Booking } from "../types/booking";

export function useFetchCourtEvents() {
  //const setEventsByCourt = useCourtSchedule((state) => state.setEventsByCourt);

  const fetchEvents = async (courtId: string, startStr: string, startEnd: string) => {
    try {
      const booking: Booking[] = await getCourtEvents(courtId,startStr,startEnd);
      //console.log('useFetchCourtEvents '+booking[0].date);
      //setEventsByCourt(courtId, booking);
      return booking;
    } catch (error) {
      console.error("Error fetching court events:", error);
    }
  };

  return { fetchEvents };
}
