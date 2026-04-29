export type DataSource = 'mock' | 'api';
export type BookingStatus =
  | 'reservado'
  | 'confirmado'
  | 'pending'
  | 'confirmed'
  | 'cancelled'
  | 'bloqueado';

export type PaymentMethod =
  | 'pendiente'
  | 'transferencia'
  | 'efectivo'
  | 'tarjeta';

export type PaymentStatus = 'pending' | 'paid';

export interface CourtDTO {
  id: string;
  title: string;
  type: string;
}

export interface BookingDTO {
  id: string;
  courtId: string;
  phoneNumber: string;
  title: string;
  status: BookingStatus;
  startTime: string; // ISO UTC
  endTime: string;   // ISO UTC
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paidAt?: string | null;
  paymentConfirmedBy?: string | null;
}

export interface CalendarDayResponse {
  courts: CourtDTO[];
  bookings: BookingDTO[];
}

export interface CourtApi {
  listCourts(): Promise<CourtDTO[]>;
  listBookingsByDay(params: { date: Date; courtIds?: string[] }): Promise<BookingDTO[]>;
  listCalendarDay(params: { date: Date }): Promise<CalendarDayResponse>;
}
