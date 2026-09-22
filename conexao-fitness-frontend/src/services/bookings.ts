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
    // 1. Agendamentos do Personal Trainer Lucas Silva (demo-personal-id-002)
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
        name: "Gabriel Souza (Aluno Conexão)",
        email: "aluno.demo@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 99333-5566",
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
        name: "Mariana Lima (Atleta)",
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
    {
      id: "demo-booking-rodrigo-003",
      providerId: "demo-personal-id-002",
      studentId: "demo-student-rodrigo",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "demo-service-003",
        name: "Treinamento de Força & Sobrecarga",
        type: "PERSONAL",
        price: 150,
        durationMinutes: 60,
      },
      student: {
        id: "demo-student-rodrigo",
        name: "Rodrigo Alves (Iniciante)",
        email: "rodrigo.alves@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 98822-3344",
      },
      slot: {
        id: "demo-slot-003",
        startsAt: new Date(Date.now() + 52 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 53 * 3600000).toISOString(),
      },
    },

    // 2. Agendamentos da Nutricionista Dra. Camila Santos (demo-nutri-id-004)
    {
      id: "demo-booking-nutri-gabriel-004",
      providerId: "demo-nutri-id-004",
      studentId: "demo-student-id-003",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "demo-service-nutri-001",
        name: "Consulta Nutricional Esportiva + Bioimpedância",
        type: "PERSONAL",
        price: 280,
        durationMinutes: 60,
      },
      student: {
        id: "demo-student-id-003",
        name: "Gabriel Souza (Aluno Conexão)",
        email: "aluno.demo@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 99333-5566",
      },
      slot: {
        id: "demo-slot-nutri-001",
        startsAt: new Date(Date.now() + 8 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 9 * 3600000).toISOString(),
      },
    },
    {
      id: "demo-booking-nutri-larissa-005",
      providerId: "demo-nutri-id-004",
      studentId: "demo-student-larissa",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "demo-service-nutri-002",
        name: "Acompanhamento Nutricional & Recomposição",
        type: "PERSONAL",
        price: 220,
        durationMinutes: 45,
      },
      student: {
        id: "demo-student-larissa",
        name: "Larissa Torres (Funcional)",
        email: "larissa.torres@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 97711-2233",
      },
      slot: {
        id: "demo-slot-nutri-002",
        startsAt: new Date(Date.now() + 32 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 33 * 3600000).toISOString(),
      },
    },
    {
      id: "demo-booking-nutri-mariana-006",
      providerId: "demo-nutri-id-004",
      studentId: "demo-student-mariana",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "demo-service-nutri-003",
        name: "Plano Alimentar para Definição & Baixo Carboidrato (1.650 kcal)",
        type: "PERSONAL",
        price: 260,
        durationMinutes: 60,
      },
      student: {
        id: "demo-student-mariana",
        name: "Mariana Lima (Atleta)",
        email: "mariana.atleta@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 97123-8899",
      },
      slot: {
        id: "demo-slot-nutri-003",
        startsAt: new Date(Date.now() + 50 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 51 * 3600000).toISOString(),
      },
    },
    {
      id: "demo-booking-nutri-rodrigo-007",
      providerId: "demo-nutri-id-004",
      studentId: "demo-student-rodrigo",
      status: "CONFIRMED",
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      service: {
        id: "demo-service-nutri-004",
        name: "Reeducação Alimentar & Emagrecimento Consciente (1.900 kcal)",
        type: "PERSONAL",
        price: 200,
        durationMinutes: 45,
      },
      student: {
        id: "demo-student-rodrigo",
        name: "Rodrigo Alves (Iniciante)",
        email: "rodrigo.alves@conexao.com",
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
        phone: "(11) 98822-3344",
      },
      slot: {
        id: "demo-slot-nutri-004",
        startsAt: new Date(Date.now() + 72 * 3600000).toISOString(),
        endsAt: new Date(Date.now() + 73 * 3600000).toISOString(),
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
  providerId?: string;
  studentId?: string;
  price?: number;
  status?: BookingStatus;
}): any {
  const current = getDemoBookings();
  const studentId = customStudent.studentId || `demo-student-${Date.now()}`;
  const impersonatedRole = localStorage.getItem("cf_impersonation_role");
  const effectiveProviderId =
    customStudent.providerId ||
    (impersonatedRole === "NUTRICIONISTA" ? "demo-nutri-id-004" : "demo-personal-id-002");

  const newBooking = {
    id: `booking-${Date.now()}`,
    providerId: effectiveProviderId,
    studentId,
    status: customStudent.status || ("CONFIRMED" as const),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    service: {
      id: `service-${Date.now()}`,
      name:
        customStudent.serviceName ||
        (impersonatedRole === "NUTRICIONISTA"
          ? "Consulta Nutricional Esportiva & Plano Alimentar"
          : "Treinamento Personalizado & Consultoria VIP"),
      type: "PERSONAL",
      price: customStudent.price || (impersonatedRole === "NUTRICIONISTA" ? 220 : 200),
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
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
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
    let demoList = getDemoBookings();
    if (providerId) {
      const filtered = demoList.filter((b) => b.providerId === providerId);
      if (filtered.length > 0) {
        demoList = filtered;
      }
    }
    return status ? demoList.filter((b) => b.status === status) : demoList;
  }

  try {
    const realBookings = await apiRequest<Booking[]>(`/bookings/providers/${providerId}`, { query: { status } });
    const localBookings = getDemoBookings().filter((b) => b.providerId === providerId);
    const combined = [...(realBookings || [])];
    for (const local of localBookings) {
      if (!combined.some((b: any) => b.id === local.id)) {
        combined.unshift(local);
      }
    }
    if (combined.length === 0) {
      const defaultDemo = getDemoBookings().filter((b) => b.providerId === providerId);
      return status ? defaultDemo.filter((b) => b.status === status) : (defaultDemo.length > 0 ? defaultDemo : getDemoBookings());
    }
    return status ? combined.filter((b: any) => b.status === status) : combined;
  } catch (err) {
    console.warn("[Bookings] Fallback to demo bookings for provider:", err);
    const localBookings = getDemoBookings().filter((b) => b.providerId === providerId);
    const demoList = localBookings.length > 0 ? localBookings : getDemoBookings();
    return status ? demoList.filter((b) => b.status === status) : demoList;
  }
}
