import { apiRequest } from "@/lib/apiClient";

export interface Notification {
  id: string;
  userId: string;
  title?: string;
  message: string;
  type?: string;
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}

export function listNotifications() {
  return apiRequest<Notification[]>(`/notifications`);
}

export function getUnreadCount() {
  return apiRequest<{ unread: number }>(`/notifications/unread/count`);
}

export function markNotificationRead(id: string) {
  return apiRequest<Notification>(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllAsRead() {
  return apiRequest<{ success: boolean }>(`/notifications/read/all`, { method: "PATCH" });
}
