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

export function deleteUser(id: string) {
  return apiRequest<{ success: boolean; message: string }>(`/admin/users/${id}`, {
    method: "DELETE",
  });
}

export function bulkApproveKyc(userIds: string[]) {
  return apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/kyc-approve", {
    method: "PATCH",
    body: { userIds },
  });
}

export function bulkSuspendUsers(userIds: string[]) {
  return apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/suspend", {
    method: "PATCH",
    body: { userIds },
  });
}

export function bulkActivateUsers(userIds: string[]) {
  return apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/activate", {
    method: "PATCH",
    body: { userIds },
  });
}

export function bulkDeleteUsers(userIds: string[]) {
  return apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/delete", {
    method: "POST",
    body: { userIds },
  });
}


