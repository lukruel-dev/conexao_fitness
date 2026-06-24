import type {
    ApiClientConfig,
    ApiErrorResponse,
    Booking,
    BookingWithSlot,
    CancelBookingRequest,
    CreateBookingRequest,
    ScheduleSlot,
    Service,
    UUID,
} from './frontend_domain_types';

export class ApiClientError extends Error {
    statusCode: number;
    payload?: ApiErrorResponse | unknown;

    constructor(message: string, statusCode: number, payload?: ApiErrorResponse | unknown) {
        super(message);
        this.name = 'ApiClientError';
        this.statusCode = statusCode;
        this.payload = payload;
    }
}

export class FrontendApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;

    constructor(config: ApiClientConfig) {
        this.baseUrl = config.baseUrl.replace(/\/+$/, '');
        this.defaultHeaders = config.defaultHeaders ?? {};
    }

    private buildUrl(path: string): string {
        return `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    }

    private async request<T>(
        path: string,
        options: RequestInit = {},
    ): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...this.defaultHeaders,
            ...(options.headers as Record<string, string> | undefined),
        };

        const response = await fetch(this.buildUrl(path), {
            ...options,
            headers,
        });

        const contentType = response.headers.get('content-type') ?? '';
        const isJson = contentType.includes('application/json');

        let payload: unknown = null;

        if (isJson) {
            payload = await response.json();
        } else {
            payload = await response.text();
        }

        if (!response.ok) {
            const errorPayload = payload as Partial<ApiErrorResponse> | undefined;
            const message =
                errorPayload?.message ||
                `HTTP ${response.status} error while calling ${path}`;

            throw new ApiClientError(message, response.status, payload);
        }

        return payload as T;
    }

    async createBooking(input: CreateBookingRequest): Promise<Booking> {
        return this.request<Booking>('/bookings', {
            method: 'POST',
            body: JSON.stringify(input),
        });
    }

    async cancelBooking(
        bookingId: UUID,
        input: CancelBookingRequest,
    ): Promise<BookingWithSlot> {
        return this.request<BookingWithSlot>(`/bookings/${bookingId}/cancel`, {
            method: 'PATCH',
            body: JSON.stringify(input),
        });
    }

    async getServices(): Promise<Service[]> {
        return this.request<Service[]>('/services', {
            method: 'GET',
        });
    }

    async getServiceById(serviceId: UUID): Promise<Service> {
        return this.request<Service>(`/services/${serviceId}`, {
            method: 'GET',
        });
    }

    async getScheduleSlotsByService(serviceId: UUID): Promise<ScheduleSlot[]> {
        return this.request<ScheduleSlot[]>(`/schedule-slots?serviceId=${serviceId}`, {
            method: 'GET',
        });
    }

    async getBookingsByStudent(studentId: UUID): Promise<Booking[]> {
        return this.request<Booking[]>(`/bookings/students/${studentId}`, {
            method: 'GET',
        });
    }

    async getBookingsByService(serviceId: UUID): Promise<Booking[]> {
        return this.request<Booking[]>(`/bookings/services/${serviceId}`, {
            method: 'GET',
        });
    }
}

export const apiClient = new FrontendApiClient({
    baseUrl: 'http://localhost:3001',
});