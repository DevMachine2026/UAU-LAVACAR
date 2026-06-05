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
  const response = await api.get<ApiEnvelope<VehicleSizeCategory[]>>("/vehicle-sizes");
  return unwrap(response.data);
}

export async function createVehicleSizeCategory(payload: VehicleSizeCategoryPayload) {
  const response = await api.post<ApiEnvelope<VehicleSizeCategory>>("/vehicle-sizes", payload);
  return unwrap(response.data);
}

export async function updateVehicleSizeCategory(id: string, payload: Partial<VehicleSizeCategoryPayload>) {
  const response = await api.put<ApiEnvelope<VehicleSizeCategory>>(`/vehicle-sizes/${id}`, payload);
  return unwrap(response.data);
}

export async function setVehicleSizeCategoryActive(id: string, active: boolean) {
  return updateVehicleSizeCategory(id, { isActive: active });
}

/** Regras marca/modelo ainda não possuem controller dedicado no backend. */
export async function getVehicleModelSizeRules() {
  return [] as VehicleModelSizeRule[];
}

export async function createVehicleModelSizeRule(_payload: VehicleModelSizeRulePayload) {
  throw new Error("Cadastro de regras marca/modelo ainda não disponível na API.");
}

export async function updateVehicleModelSizeRule(_id: string, _payload: VehicleModelSizeRulePayload) {
  throw new Error("Atualização de regras marca/modelo ainda não disponível na API.");
}

export async function setVehicleModelSizeRuleActive(_id: string, _active: boolean) {
  throw new Error("Ativação de regras marca/modelo ainda não disponível na API.");
}
