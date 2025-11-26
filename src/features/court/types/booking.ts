export interface Booking {
  id: string
  userId: string
  courtId: number
  paymentId: string | null
  startTime: string  // ISO string
  endTime:   string  // ISO string
  status:    string
  date:      string  // YYYY-MM-DD
  title: string
}