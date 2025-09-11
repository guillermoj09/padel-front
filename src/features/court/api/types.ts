export type DataSource = 'mock' | 'api';
export type BookingStatus = 'reservado' | 'confirmado';

export interface CourtDTO {
  id: string;
  title: string;
}

export interface BookingDTO {
  id: string;
  courtId: string;
  title: string;
  status: BookingStatus;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
}

export interface CalendarDayResponse {
  courts: CourtDTO[];
  bookings: BookingDTO[];
}

export interface CourtApi {
  listCourts(): Promise<CourtDTO[]>;
  listBookingsByDay(params: { date: Date; courtIds?: string[] }): Promise<BookingDTO[]>;
  listCalendarDay(params: { date: Date }): Promise<CalendarDayResponse>; // agregador
}
