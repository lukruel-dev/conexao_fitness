// ============================================================
// Tipos da API Conexão Fitness — espelham contratos do backend
// (NestJS + TypeORM). Mantenha em sincronia com o backend.
// ============================================================

export type BookingStatus = "CONFIRMED" | "CANCELLED" | "PENDING";

export interface Booking {
  id: string;
  serviceId: string;
  slotId: string;
  studentId: string;
  status: BookingStatus;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingDto {
  serviceId: string;
  slotId: string;
  studentId: string;
}

export interface CancelBookingDto {
  studentId?: string;
}

export interface CreateBookingResponse {
  booking: Booking;
  clientSecret: string;
  paymentIntentId: string;
}

export interface RetryPaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

// ----------------- Services -----------------
export type ProviderType = "PERSONAL" | "ACADEMIA";
export type ServiceType = "DIARIA" | "SESSAO" | "PLANO_MENSAL" | "DAY_PASS";

export interface Service {
  id: string;
  providerType: ProviderType;
  providerId: string;
  unitId: string | null;
  name: string;
  description: string | null;
  modality: string;
  durationMinutes: number;
  type: ServiceType;
  price: string; // backend envia decimal como string
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Campos enriquecidos no frontend (futuro: endpoint que já entrega)
  providerName?: string;
  providerAvatar?: string;
  professionTitle?: string | null;
  rating?: number;
  reviewsCount?: number;
  providerRating?: number | null;
  totalReviews?: number;
  distanceKm?: number;
  distance?: number | null;
  boostScore?: number;
  city?: string;
  isPremium?: boolean;
}

// ----------------- Slots -----------------
export type SlotStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export interface ScheduleSlot {
  id: string;
  serviceId: string;
  startsAt: string;
  endsAt: string;
  status: SlotStatus;
  studentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ----------------- Auth -----------------
export type UserRole = "STUDENT" | "PERSONAL" | "ACADEMIA" | "ADMIN";

export type UserStatus = "ATIVO" | "SUSPENSO" | "PENDENTE_KYC" | "KYC_APROVADO" | "KYC_REJEITADO";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  personalProfile?: {
    cref?: string;
    documentUrl?: string;
  };
}

export interface AdminDashboardMetrics {
  totalUsers: number;
  activeSubscriptions: number;
  totalBookings: number;
  totalServices: number;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string | null;
  professionTitle?: string | null;
  cpf?: string | null;
  phone?: string | null;
  planName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  professionTitle?: string;
  cpf?: string;
  phone?: string;
  professionalRegistrationId?: string;
  professionalDocumentUrl?: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}
