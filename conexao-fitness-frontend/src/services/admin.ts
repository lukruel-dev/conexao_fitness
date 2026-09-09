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

export async function bulkApproveKyc(userIds: string[]) {
  try {
    return await apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/kyc-approve", {
      method: "PATCH",
      body: { userIds },
    });
  } catch (err: any) {
    if (err?.status === 404 || String(err?.message || "").includes("Cannot PATCH")) {
      const results = await Promise.allSettled(userIds.map((id) => approveKyc(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      return {
        success: true,
        count: succeeded,
        message: `${succeeded} usuário(s) aprovado(s) com sucesso.`,
      };
    }
    throw err;
  }
}

export async function bulkSuspendUsers(userIds: string[]) {
  try {
    return await apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/suspend", {
      method: "PATCH",
      body: { userIds },
    });
  } catch (err: any) {
    if (err?.status === 404 || String(err?.message || "").includes("Cannot PATCH")) {
      const results = await Promise.allSettled(userIds.map((id) => suspendUser(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      return {
        success: true,
        count: succeeded,
        message: `${succeeded} usuário(s) suspenso(s) com sucesso.`,
      };
    }
    throw err;
  }
}

export async function bulkActivateUsers(userIds: string[]) {
  try {
    return await apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/activate", {
      method: "PATCH",
      body: { userIds },
    });
  } catch (err: any) {
    if (err?.status === 404 || String(err?.message || "").includes("Cannot PATCH")) {
      const results = await Promise.allSettled(userIds.map((id) => activateUser(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      return {
        success: true,
        count: succeeded,
        message: `${succeeded} usuário(s) reativado(s) com sucesso.`,
      };
    }
    throw err;
  }
}

export async function bulkDeleteUsers(userIds: string[]) {
  try {
    return await apiRequest<{ success: boolean; count: number; message: string }>("/admin/users/bulk/delete", {
      method: "POST",
      body: { userIds },
    });
  } catch (err: any) {
    if (err?.status === 404 || String(err?.message || "").includes("Cannot POST /admin/users/bulk/delete")) {
      const results = await Promise.allSettled(userIds.map((id) => deleteUser(id)));
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      return {
        success: true,
        count: succeeded,
        message: `${succeeded} usuário(s) excluído(s) com sucesso.`,
      };
    }
    throw err;
  }
}


