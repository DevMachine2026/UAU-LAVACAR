import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

/** @deprecated Prefira os módulos em features/*-dashboard/*-dashboard.api.ts */
export type DashboardData = Record<string, unknown>;

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getEndpoint<T = DashboardData>(path: string) {
  const response = await api.get<ApiEnvelope<T>>(path);
  return unwrap(response.data);
}

export async function postEndpoint<T = DashboardData>(path: string, payload: unknown) {
  const response = await api.post<ApiEnvelope<T>>(path, payload);
  return unwrap(response.data);
}
