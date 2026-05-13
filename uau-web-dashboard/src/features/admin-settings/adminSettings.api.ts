import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type AdminSettings = Record<string, number>;

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getAdminSettings() {
  const response = await api.get<ApiEnvelope<AdminSettings>>("/admin-settings");
  return unwrap(response.data);
}

export async function updateAdminSettings(payload: AdminSettings) {
  const response = await api.put<ApiEnvelope<AdminSettings>>("/admin-settings", payload);
  return unwrap(response.data);
}
