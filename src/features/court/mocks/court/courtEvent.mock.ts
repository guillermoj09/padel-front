import type { Booking } from '@/features/court/types/booking';

export const mockCourtEvents: Record<string, Booking[]> = {
  '1': [
    {
      id: '1',
      userId: 'mock-user-1',
      courtId: 1,
      paymentId: null,
      startTime: '2025-05-26T13:00:00.000Z',
      endTime: '2025-05-26T14:00:00.000Z',
      status: 'confirmed',
      date: '2025-05-26',
      title: 'Partido en - 9 AM',
    },
    {
      id: '2',
      userId: 'mock-user-2',
      courtId: 1,
      paymentId: null,
      startTime: '2025-05-27T11:00:00.000Z',
      endTime: '2025-05-27T12:00:00.000Z',
      status: 'confirmed',
      date: '2025-05-27',
      title: 'Clase de pádel en - 11 AM',
    },
  ],
  '2': [],
  '3': [],
};
