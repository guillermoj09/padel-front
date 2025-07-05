// src/data/mocks/courtEvents.mock.ts
import { CourtEvent } from '@/features/court/store/courtScheduleStore';

export const mockCourtEvents: Record<string, CourtEvent[]> = {
  'padel-1': [
     {
      id: '1',
      title: `Partido en - 9 AM`,
      start: '2025-05-26 13:00',
      end: '2025-05-26 14:00',
    },
    {
      id: '2',
      title: `Clase de pádel en - 11 AM`,
      start: '2025-05-27 11:00',
      end: '2025-05-27 12:00',
    },
  ],
  'padel-2': [],
  'padel-3': [],
};
