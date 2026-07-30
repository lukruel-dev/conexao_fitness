import { apiRequest } from "@/lib/apiClient";
import type { Booking, BookingStatus, CancelBookingDto, CreateBookingDto, CreateBookingResponse, RetryPaymentResponse } from "@/types/api";

export async function createBooking(dto: CreateBookingDto): Promise<CreateBookingResponse> {
  return apiRequest<CreateBookingResponse>("/bookings", { method: "POST", body: dto });
}

export async function cancelBooking(bookingId: string, dto?: CancelBookingDto): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    body: dto && dto.studentId ? dto : undefined,
  });
}

export async function retryBookingPayment(bookingId: string): Promise<RetryPaymentResponse> {
  return apiRequest<RetryPaymentResponse>(`/bookings/${bookingId}/retry-payment`, {
    method: "POST",
  });
}

export async function payBookingWithWallet(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/pay-with-wallet`, {
    method: "POST",
  });
}
export async function adminListBookings(status?: BookingStatus): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/admin/bookings`, { query: { status } });
}

export async function adminCancelBooking(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel`, { method: "PATCH" });
}

export async function listBookingsByStudent(
  studentId: string,
  status?: BookingStatus,
): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/bookings/students/${studentId}`, { query: { status } });
}

export async function listBookingsByService(
  serviceId: string,
  status?: BookingStatus,
): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/bookings/services/${serviceId}`, { query: { status } });
}

export async function listBookingsByProvider(
  providerId: string,
  status?: BookingStatus,
): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/bookings/providers/${providerId}`, { query: { status } });
}
