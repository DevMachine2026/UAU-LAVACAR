import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type?: string;
  status?: string;
  readAt?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getMyNotifications() {
  const response = await api.get<ApiEnvelope<AppNotification[] | { items?: AppNotification[]; data?: AppNotification[] }>>(
    "/notifications/me"
  );
  return unwrap(response.data);
}

export async function getUnreadCount() {
  const response = await api.get<ApiEnvelope<{ count?: number; unreadCount?: number } | number>>(
    "/notifications/me/unread-count"
  );
  return unwrap(response.data);
}

export async function markAsRead(id: string) {
  const response = await api.patch<ApiEnvelope<unknown>>(`/notifications/${id}/read`);
  return unwrap(response.data);
}

export async function markAllAsRead() {
  const response = await api.patch<ApiEnvelope<unknown>>("/notifications/read-all");
  return unwrap(response.data);
}
