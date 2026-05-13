import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type VehicleSizeCategory = {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive?: boolean;
};

export type VehicleModelSizeRule = {
  id: string;
  brand: string;
  model: string;
  sizeCategoryId: string;
  isActive?: boolean;
  sizeCategory?: VehicleSizeCategory;
};

export type VehicleSizeCategoryPayload = Omit<VehicleSizeCategory, "id">;
export type VehicleModelSizeRulePayload = {
  brand: string;
  model: string;
  sizeCategoryId: string;
  isActive?: boolean;
};

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getVehicleSizeCategories() {
  const response = await api.get<ApiEnvelope<VehicleSizeCategory[]>>("/vehicle-size-categories");
  return unwrap(response.data);
}

export async function createVehicleSizeCategory(payload: VehicleSizeCategoryPayload) {
  const response = await api.post<ApiEnvelope<VehicleSizeCategory>>("/vehicle-size-categories", payload);
  return unwrap(response.data);
}

export async function updateVehicleSizeCategory(id: string, payload: VehicleSizeCategoryPayload) {
  const response = await api.put<ApiEnvelope<VehicleSizeCategory>>(`/vehicle-size-categories/${id}`, payload);
  return unwrap(response.data);
}

export async function setVehicleSizeCategoryActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<VehicleSizeCategory>>(`/vehicle-size-categories/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}

export async function getVehicleModelSizeRules() {
  const response = await api.get<ApiEnvelope<VehicleModelSizeRule[]>>("/vehicle-model-size-rules");
  return unwrap(response.data);
}

export async function createVehicleModelSizeRule(payload: VehicleModelSizeRulePayload) {
  const response = await api.post<ApiEnvelope<VehicleModelSizeRule>>("/vehicle-model-size-rules", payload);
  return unwrap(response.data);
}

export async function updateVehicleModelSizeRule(id: string, payload: VehicleModelSizeRulePayload) {
  const response = await api.put<ApiEnvelope<VehicleModelSizeRule>>(`/vehicle-model-size-rules/${id}`, payload);
  return unwrap(response.data);
}

export async function setVehicleModelSizeRuleActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<VehicleModelSizeRule>>(`/vehicle-model-size-rules/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}
