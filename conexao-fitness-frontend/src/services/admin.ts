import { apiRequest } from "@/lib/apiClient";
import type { AdminDashboardMetrics, AdminUser, UserRole, UserStatus } from "@/types/api";

export function getAdminDashboard() {
  return apiRequest<AdminDashboardMetrics>("/admin/dashboard");
}

export function listAdminUsers(filters: { role?: UserRole; status?: UserStatus } = {}) {
  return apiRequest<AdminUser[]>("/admin/users", { query: filters });
}

export function suspendUser(id: string) {
  return apiRequest<AdminUser>(`/admin/users/${id}/suspend`, { method: "PATCH" });
}

export function activateUser(id: string) {
  return apiRequest<AdminUser>(`/admin/users/${id}/activate`, { method: "PATCH" });
}

export function approveKyc(id: string) {
  return apiRequest<AdminUser>(`/admin/users/${id}/kyc-approve`, { method: "PATCH" });
}

export function rejectKyc(id: string, reason: string) {
  return apiRequest<AdminUser>(`/admin/users/${id}/kyc-reject`, {
    method: "PATCH",
    body: { reason },
  });
}

export function listAdminSubscriptions() {
  return apiRequest<any[]>("/admin/subscriptions");
}
