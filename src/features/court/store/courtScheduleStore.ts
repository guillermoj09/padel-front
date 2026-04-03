// src/store/useCourtSchedule.ts
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Booking } from '@/features/court/types/booking';

type CourtScheduleState = {
  eventsByCourt: Record<string, Booking[]>;
  getEvents: (courtId: string) => Booking[];
  addEvent: (courtId: string, event: Booking) => void;
  setEventsByCourt: (courtId: string, events: Booking[]) => void;
};

export const useCourtSchedule = create<CourtScheduleState>()(
  persist(
    (set, get) => ({
      eventsByCourt: {
        '1': [],
        '2': [],
        '3': [],
      },

      getEvents: (courtId) => get().eventsByCourt[courtId] || [],

      addEvent: (courtId, event) =>
        set((state) => ({
          eventsByCourt: {
            ...state.eventsByCourt,
            [courtId]: [...(state.eventsByCourt[courtId] || []), event],
          },
        })),

      setEventsByCourt: (courtId, events) =>
        set((state) => ({
          eventsByCourt: {
            ...state.eventsByCourt,
            [courtId]: events,
          },
        })),
    }),
    {
      name: 'court-schedule-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
