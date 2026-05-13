import { useQuery } from "@tanstack/react-query";
import { getMyNotifications, getUnreadCount } from "@/features/notifications/notifications.api";

export function useMyNotifications() {
  return useQuery({ queryKey: ["notifications", "me"], queryFn: getMyNotifications });
}

export function useUnreadNotificationsCount() {
  return useQuery({ queryKey: ["notifications", "unread-count"], queryFn: getUnreadCount });
}
