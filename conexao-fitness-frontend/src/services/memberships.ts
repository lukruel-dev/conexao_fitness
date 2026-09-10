import { apiRequest } from '@/lib/apiClient';

export type PlanRecurrence = 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUAL' | 'ANNUAL' | 'SINGLE';
export type EnrollmentStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED' | 'PENDING_PAYMENT';
export type EnrollmentPaymentMethod = 'STRIPE' | 'WALLET' | 'PIX' | 'MANUAL';
export type EnrollmentPaymentStatus = 'PAID' | 'PENDING' | 'REFUNDED';
export type AccessStatus = 'GRANTED' | 'DENIED';

export interface MembershipPlan {
  id: string;
  academiaId: string;
  name: string;
  description?: string;
  price: string;
  durationDays: number;
  recurrence: PlanRecurrence;
  modalities?: string[];
  benefits?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GymEnrollment {
  id: string;
  studentId: string;
  student?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    cpf?: string;
  };
  academiaId: string;
  academia?: {
    id: string;
    name: string;
    avatarUrl?: string;
    cityBase?: string;
    academiaProfile?: {
      nomeFantasia?: string;
      razaoSocial?: string;
    };
  };
  planId?: string;
  plan?: MembershipPlan;
  planName: string;
  amountPaid: string;
  paymentMethod: EnrollmentPaymentMethod;
  paymentStatus: EnrollmentPaymentStatus;
  status: EnrollmentStatus;
  startDate: string;
  endDate: string;
  qrAccessCode: string;
  notes?: string;
  isExpiringSoon?: boolean;
  daysRemaining?: number;
  qrPayload?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GymAccessLog {
  id: string;
  enrollmentId?: string;
  studentId?: string;
  student?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  academiaId: string;
  status: AccessStatus;
  denialReason?: string;
  deviceInfo: string;
  accessedAt: string;
}

export interface ValidateAccessResponse {
  granted: boolean;
  isDayPass?: boolean;
  canChargeDayPass?: boolean;
  dayPassPrice?: number;
  studentBalance?: number;
  hasEnoughBalance?: boolean;
  reason?: string;
  student?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    cpf?: string;
  };
  enrollment?: {
    id: string;
    planName: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    status: EnrollmentStatus;
  };
  accessLogId?: string;
  message: string;
}

export interface ChargeDayPassDto {
  studentIdentifier: string;
  customAmount?: number;
  deviceInfo?: string;
}

export interface ChargeDayPassResponse {
  granted: boolean;
  isDayPass: boolean;
  reason?: string;
  amountDebited?: number;
  requiredAmount?: number;
  currentBalance?: number;
  newBalance?: number;
  student?: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    cpf?: string;
  };
  enrollment?: {
    id: string;
    planName: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    status: EnrollmentStatus;
  };
  accessLogId: string;
  message: string;
}

export interface GymDashboardStats {
  tier: {
    hasAccess: boolean;
    planName: string;
  };
  totalActiveStudents: number;
  totalStudents: number;
  checkinsToday: number;
  expiringSoon: number;
  estimatedMRR: number;
}

export interface CreatePlanDto {
  name: string;
  description?: string;
  price: number;
  durationDays: number;
  recurrence?: PlanRecurrence;
  modalities?: string[];
  benefits?: string[];
  isActive?: boolean;
}

export interface UpdatePlanDto extends Partial<CreatePlanDto> {}

export interface EnrollOnlineDto {
  planId: string;
  paymentMethod?: EnrollmentPaymentMethod;
}

export interface ManualEnrollmentDto {
  studentId?: string;
  studentName: string;
  studentEmail: string;
  studentCpf?: string;
  planId?: string;
  planName: string;
  amountPaid: number;
  durationDays: number;
  paymentMethod?: EnrollmentPaymentMethod;
  notes?: string;
}

export interface ValidateAccessDto {
  qrCode: string;
  deviceInfo?: string;
}

export interface RenewEnrollmentDto {
  additionalDays?: number;
  amountPaid?: number;
  paymentMethod?: EnrollmentPaymentMethod;
}

export interface FilterEnrollmentsDto {
  status?: EnrollmentStatus;
  search?: string;
}

// =========================================================================
// API SERVICES
// =========================================================================

export async function checkGymPlanTier(): Promise<{ hasAccess: boolean; planName: string }> {
  return apiRequest<{ hasAccess: boolean; planName: string }>('/memberships/tier/status');
}

export async function listMyGymPlans(): Promise<MembershipPlan[]> {
  return apiRequest<MembershipPlan[]>('/memberships/plans/my');
}

export async function createGymPlan(dto: CreatePlanDto): Promise<MembershipPlan> {
  return apiRequest<MembershipPlan>('/memberships/plans', { method: 'POST', body: dto });
}

export async function updateGymPlan(id: string, dto: UpdatePlanDto): Promise<MembershipPlan> {
  return apiRequest<MembershipPlan>(`/memberships/plans/${id}`, { method: 'PATCH', body: dto });
}

export async function deleteGymPlan(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>(`/memberships/plans/${id}`, { method: 'DELETE' });
}

export async function getPublicPlansByAcademia(academiaId: string): Promise<MembershipPlan[]> {
  return apiRequest<MembershipPlan[]>(`/memberships/plans/academia/${academiaId}`);
}

export async function enrollOnline(academiaId: string, dto: EnrollOnlineDto): Promise<GymEnrollment> {
  return apiRequest<GymEnrollment>(`/memberships/enroll-online/${academiaId}`, {
    method: 'POST',
    body: dto,
  });
}

export async function createManualEnrollment(dto: ManualEnrollmentDto): Promise<GymEnrollment> {
  return apiRequest<GymEnrollment>('/memberships/enrollments/manual', {
    method: 'POST',
    body: dto,
  });
}

export async function listMyGymEnrollments(filters?: FilterEnrollmentsDto): Promise<{
  items: GymEnrollment[];
  total: number;
  tier: { hasAccess: boolean; planName: string };
}> {
  return apiRequest<{
    items: GymEnrollment[];
    total: number;
    tier: { hasAccess: boolean; planName: string };
  }>('/memberships/enrollments/my', {
    query: {
      status: filters?.status,
      search: filters?.search,
    },
  });
}

export async function renewGymEnrollment(id: string, dto: RenewEnrollmentDto): Promise<GymEnrollment> {
  return apiRequest<GymEnrollment>(`/memberships/enrollments/${id}/renew`, {
    method: 'POST',
    body: dto,
  });
}

export async function updateGymEnrollmentStatus(
  id: string,
  status: EnrollmentStatus,
  notes?: string,
): Promise<GymEnrollment> {
  return apiRequest<GymEnrollment>(`/memberships/enrollments/${id}/status`, {
    method: 'PATCH',
    body: { status, notes },
  });
}

export async function validateGymAccess(dto: ValidateAccessDto): Promise<ValidateAccessResponse> {
  return apiRequest<ValidateAccessResponse>('/memberships/validate-access', {
    method: 'POST',
    body: dto,
  });
}

export async function chargeGymDayPass(dto: ChargeDayPassDto): Promise<ChargeDayPassResponse> {
  return apiRequest<ChargeDayPassResponse>('/memberships/charge-daypass', {
    method: 'POST',
    body: dto,
  });
}

export async function getMyGymDayPassPrice(): Promise<{ dayPassPrice: number }> {
  return apiRequest<{ dayPassPrice: number }>('/memberships/daypass-price/my');
}

export async function getGymAccessLogs(limit = 40): Promise<GymAccessLog[]> {
  return apiRequest<GymAccessLog[]>('/memberships/access-logs/my', {
    query: { limit },
  });
}

export async function getGymDashboardStats(): Promise<GymDashboardStats> {
  return apiRequest<GymDashboardStats>('/memberships/dashboard-stats/my');
}

export async function getStudentEnrollments(): Promise<GymEnrollment[]> {
  return apiRequest<GymEnrollment[]>('/memberships/student/my-enrollments');
}

export async function getStudentPass(enrollmentId: string): Promise<any> {
  return apiRequest<any>(`/memberships/student/pass/${enrollmentId}`);
}
