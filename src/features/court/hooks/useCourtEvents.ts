import { useEffect } from "react";
import { useFetchCourtEvents } from "@/features/court/hooks/useFetchCourtEvents";
import { useCourtSchedule } from "@/features/court/store/courtScheduleStore";

export function useCourtEvents(courtId: string) {
  const { events, loading } = useFetchCourtEvents(courtId);
  const { setEventsByCourt } = useCourtSchedule();

  useEffect(() => {
    if (!loading) {
      setEventsByCourt(courtId, events);
    }
  }, [loading, events, courtId, setEventsByCourt]);

  return { events, loading };
}
