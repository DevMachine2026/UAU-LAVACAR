import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type FraudFlagStatus = "OPEN" | "REVIEWED" | "DISMISSED" | "BLOCKED" | string;
export type FraudFlagSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;

export type FraudFlagFilters = {
  status?: string;
  severity?: string;
  type?: string;
};

export type FraudFlag = {
  id: string;
  userId?: string | null;
  type?: string;
  severity?: FraudFlagSeverity;
  status?: FraudFlagStatus;
  reason?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  reviewedAt?: string | null;
  reviewerUserId?: string | null;
};

export type ReviewFraudFlagPayload = {
  status: "REVIEWED" | "DISMISSED" | "BLOCKED";
  reason?: string;
};

export type SecurityLogFilters = {
  eventType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
};

export type SecurityLog = {
  id: string;
  eventType?: string;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
};

export type UserRiskActionPayload = {
  reason: string;
};

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getSecurityLogs(filters: SecurityLogFilters) {
  const response = await api.get<ApiEnvelope<SecurityLog[]>>("/antifraud/security-logs", { params: filters });
  return unwrap(response.data);
}

export async function getFraudFlags(filters: FraudFlagFilters) {
  const response = await api.get<ApiEnvelope<FraudFlag[]>>("/antifraud/flags", { params: filters });
  return unwrap(response.data);
}

export async function getFraudFlag(id: string) {
  const response = await api.get<ApiEnvelope<FraudFlag>>(`/antifraud/flags/${id}`);
  return unwrap(response.data);
}

export async function reviewFraudFlag(id: string, payload: ReviewFraudFlagPayload) {
  const response = await api.patch<ApiEnvelope<FraudFlag>>(`/antifraud/flags/${id}/review`, payload);
  return unwrap(response.data);
}

export async function markUserSuspect(userId: string, payload: UserRiskActionPayload) {
  const response = await api.post<ApiEnvelope<unknown>>(`/antifraud/users/${userId}/mark-suspect`, payload);
  return unwrap(response.data);
}

export async function blockUser(userId: string, payload: UserRiskActionPayload) {
  const response = await api.post<ApiEnvelope<unknown>>(`/antifraud/users/${userId}/block`, payload);
  return unwrap(response.data);
}

export async function unblockUser(userId: string, payload: UserRiskActionPayload) {
  const response = await api.post<ApiEnvelope<unknown>>(`/antifraud/users/${userId}/unblock`, payload);
  return unwrap(response.data);
}
