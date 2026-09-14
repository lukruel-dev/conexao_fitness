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

export async function simulateBookingSuccess(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/simulate-success`, {
    method: "POST",
  });
}
export async function adminListBookings(status?: BookingStatus): Promise<Booking[]> {
  return apiRequest<Booking[]>(`/admin/bookings`, { query: { status } });
}

export async function adminCancelBooking(bookingId: string): Promise<Booking> {
  return apiRequest<Booking>(`/bookings/${bookingId}/cancel`, { method: "PATCH" });
}

const DEMO_BOOKINGS_STORAGE_KEY = "cf_demo_provider_bookings_v2";

export function getDemoBookings(): any[] {
  try {
    const raw = localStorage.getItem(DEMO_BOOKINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}

  const defaultDemoBookings: any[] = [
    {
      id: "demo-booking-gabriel-001",
      providerId: "demo-personal-id-002",
      studentId: "demo-student-id-003",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "demo-service-001",
        name: "Consultoria Premium & Personal VIP",
        type: "PERSONAL",
        price: 250,
        durationMinutes: 60,
      },
      student: {
        id: "demo-student-id-003",
        name: "Gabriel Souza (Aluno Demo Teste)",
        email: "aluno.demo@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 98765-4321",
      },
      slot: {
        id: "demo-slot-001",
        startsAt: new Date(Date.now() + 4 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 5 * 3600000).toISOString(),
      },
    },
    {
      id: "demo-booking-mariana-002",
      providerId: "demo-personal-id-002",
      studentId: "demo-student-mariana",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "demo-service-002",
        name: "Periodização de Hipertrofia & Biomecânica",
        type: "PERSONAL",
        price: 180,
        durationMinutes: 60,
      },
      student: {
        id: "demo-student-mariana",
        name: "Mariana Lima (Atleta Demo)",
        email: "mariana.atleta@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 97123-8899",
      },
      slot: {
        id: "demo-slot-002",
        startsAt: new Date(Date.now() + 28 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 29 * 3600000).toISOString(),
      },
    },
  ];

  try {
    localStorage.setItem(DEMO_BOOKINGS_STORAGE_KEY, JSON.stringify(defaultDemoBookings));
  } catch {}

  return defaultDemoBookings;
}

export function addDemoBooking(customStudent: {
  name: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  serviceName?: string;
  goal?: string;
}): any {
  const current = getDemoBookings();
  const studentId = `demo-student-${Date.now()}`;
  const newBooking = {
    id: `demo-booking-${Date.now()}`,
    providerId: "demo-personal-id-002",
    studentId,
    status: "CONFIRMED" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    service: {
      id: `service-${Date.now()}`,
      name: customStudent.serviceName || "Treinamento Personalizado & Consultoria VIP",
      type: "PERSONAL",
      price: 200,
      durationMinutes: 60,
    },
    student: {
      id: studentId,
      name: customStudent.name,
      email: customStudent.email || `${customStudent.name.toLowerCase().replace(/\s+/g, ".")}@conexao.com`,
      avatarUrl:
        customStudent.avatarUrl ||
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`,
      phone: customStudent.phone || "(11) 99887-6655",
    },
    slot: {
      id: `slot-${Date.now()}`,
      startsAt: new Date(Date.now() + 2 * 3600000).toISOString(),
      endsAt: new Date(Date.now() + 3 * 3600000).toISOString(),
    },
  };

  const updated = [newBooking, ...current];
  try {
    localStorage.setItem(DEMO_BOOKINGS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}
  return newBooking;
}

export function resetDemoBookings(): void {
  localStorage.removeItem(DEMO_BOOKINGS_STORAGE_KEY);
  getDemoBookings();
}

export async function listBookingsByStudent(
  studentId: string,
  status?: BookingStatus,
): Promise<Booking[]> {
  const isDemo =
    studentId.startsWith("demo-") ||
    localStorage.getItem("cf_impersonation_active") === "true";

  if (isDemo) {
    const demoList = getDemoBookings().filter(
      (b) => b.studentId === studentId || b.student?.id === studentId || studentId === "demo-student-id-003"
    );
    return status ? demoList.filter((b) => b.status === status) : demoList;
  }

  try {
    return await apiRequest<Booking[]>(`/bookings/students/${studentId}`, { query: { status } });
  } catch (err) {
    const demoList = getDemoBookings().filter(
      (b) => b.studentId === studentId || b.student?.id === studentId || studentId === "demo-student-id-003"
    );
    return status ? demoList.filter((b) => b.status === status) : demoList;
  }
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
  const isDemo =
    providerId.startsWith("demo-") ||
    localStorage.getItem("cf_impersonation_active") === "true";

  if (isDemo) {
    const demoList = getDemoBookings();
    return status ? demoList.filter((b) => b.status === status) : demoList;
  }

  try {
    const realBookings = await apiRequest<Booking[]>(`/bookings/providers/${providerId}`, { query: { status } });
    if (!realBookings || realBookings.length === 0) {
      return getDemoBookings();
    }
    return realBookings;
  } catch (err) {
    console.warn("[Bookings] Fallback to demo bookings for provider:", err);
    const demoList = getDemoBookings();
    return status ? demoList.filter((b) => b.status === status) : demoList;
  }
}
