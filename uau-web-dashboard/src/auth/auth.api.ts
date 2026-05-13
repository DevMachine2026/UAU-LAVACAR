import { api } from "@/api/client";
import { ApiEnvelope, LoginResponse } from "@/api/types";

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) {
    throw new Error(envelope.error.message);
  }
  return envelope.data;
}

export async function loginRequest(email: string, password: string) {
  const response = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
  return unwrap(response.data);
}
