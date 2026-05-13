import { api } from "@/api/client";
import { ApiEnvelope, ApiUser, LoginResponse, RegisterCustomerPayload } from "@/api/types";

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) {
    throw new Error(envelope.error.message);
  }

  return envelope.data;
}

export async function login(email: string, password: string) {
  const response = await api.post<ApiEnvelope<LoginResponse>>("/auth/login", { email, password });
  return unwrap(response.data);
}

export async function registerCustomer(payload: RegisterCustomerPayload) {
  const response = await api.post<ApiEnvelope<ApiUser>>("/customers", payload);
  return unwrap(response.data);
}

export async function getMe() {
  const response = await api.get<ApiEnvelope<ApiUser>>("/users/me");
  return unwrap(response.data);
}
