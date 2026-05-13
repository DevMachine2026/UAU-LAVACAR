import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type Vehicle = {
  id: string;
  plate: string;
  brand?: string | null;
  make?: string | null;
  model?: string | null;
  color?: string | null;
  isActive?: boolean;
  isPrimary?: boolean;
  primary?: boolean;
  [key: string]: unknown;
};

export type CreateVehiclePayload = {
  plate: string;
  brand?: string;
  model?: string;
  color?: string;
};

export type UpdateVehiclePayload = Partial<CreateVehiclePayload>;

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getVehicles() {
  const response = await api.get<ApiEnvelope<Vehicle[] | { items?: Vehicle[]; data?: Vehicle[] }>>("/vehicles");
  return unwrap(response.data);
}

export async function createVehicle(payload: CreateVehiclePayload) {
  const response = await api.post<ApiEnvelope<Vehicle>>("/vehicles", payload);
  return unwrap(response.data);
}

export async function updateVehicle(id: string, payload: UpdateVehiclePayload) {
  const response = await api.put<ApiEnvelope<Vehicle>>(`/vehicles/${id}`, payload);
  return unwrap(response.data);
}

export async function activateVehicle(id: string) {
  const response = await api.patch<ApiEnvelope<Vehicle>>(`/vehicles/${id}/activate`);
  return unwrap(response.data);
}

export async function deactivateVehicle(id: string) {
  const response = await api.patch<ApiEnvelope<Vehicle>>(`/vehicles/${id}/deactivate`);
  return unwrap(response.data);
}

export async function setPrimaryVehicle(id: string) {
  const response = await api.patch<ApiEnvelope<Vehicle>>(`/vehicles/${id}/set-primary`);
  return unwrap(response.data);
}
