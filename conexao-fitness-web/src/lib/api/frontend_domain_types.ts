export type UUID = string;

export type ServiceType = 'DIARIA' | 'SESSAO' | 'PLANO_MENSAL' | 'DAY_PASS';
export type ProviderType = 'PERSONAL' | 'ACADEMIA';
export type ScheduleSlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface User {
    id: UUID;
    email: string;
    phone: string | null;
    type: string;
    status: string;
    cityBase: string | null;
    lastLat: number | null;
    lastLng: number | null;
    createdAt: string;
    updatedAt: string;
}

export interface Service {
    id: UUID;
    providerId: UUID;
    durationMinutes: number;
    price: number;
    unitId: UUID | null;
    description: string | null;
    type: ServiceType;
    isActive: boolean;
    providerType: ProviderType;
    name: string;
    modality: string;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export interface ScheduleSlot {
    id: UUID;
    status: ScheduleSlotStatus;
    serviceId: UUID;
    startsAt: string;
    endsAt: string;
    studentId: UUID | null;
    createdAt: string;
    updatedAt: string;
}

export interface Booking {
    id: UUID;
    serviceId: UUID;
    slotId: UUID;
    studentId: UUID;
    status: BookingStatus;
    cancelledAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface BookingWithSlot extends Booking {
    slot?: Partial<ScheduleSlot>;
}

export interface CreateBookingRequest {
    studentId: UUID;
    serviceId: UUID;
    slotId: UUID;
}

export interface CancelBookingRequest {
    studentId: UUID;
}

export interface ApiErrorResponse {
    message: string;
    error: string;
    statusCode: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total?: number;
    page?: number;
    pageSize?: number;
}

export interface ApiClientConfig {
    baseUrl: string;
    defaultHeaders?: Record<string, string>;
}