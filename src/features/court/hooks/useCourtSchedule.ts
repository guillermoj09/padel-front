  // src/store/useCourtSchedule.ts
import { create } from 'zustand';

export type CourtEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
};

type CourtScheduleState = {
  eventsByCourt: Record<string, CourtEvent[]>;
  getEvents: (courtId: string) => CourtEvent[];
  addEvent: (courtId: string, event: CourtEvent) => void;
};

export const useCourtSchedule = create<CourtScheduleState>((set, get) => ({
  eventsByCourt: {
    'padel-1': [],
    'padel-2': [],
    'padel-3': [],
  },

  getEvents: (courtId) => get().eventsByCourt[courtId] || [],

  addEvent: (courtId, event) => {
    set((state) => ({
      eventsByCourt: {
        ...state.eventsByCourt,
        [courtId]: [...(state.eventsByCourt[courtId] || []), event],
      },
    }));
  },
}));
