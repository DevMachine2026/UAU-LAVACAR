import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type PlanPayload = {
  name: string;
  description?: string;
  price: number;
  useVehicleSizePricing?: boolean;
  coverageType: "UNIT" | "CITY" | "STATE" | "NATIONAL";
  allowedDays?: string[];
  allowedStartTime?: string;
  allowedEndTime?: string;
  allowAllDays?: boolean;
  maxVehicles?: number;
  isActive?: boolean;
  availabilities?: Array<{ stateId?: string; cityId?: string; unitId?: string; isActive?: boolean }>;
};

export type PlanItem = PlanPayload & { id: string; availabilities?: unknown[] };
export type PlanVehicleSizePrice = {
  id: string;
  planId: string;
  sizeCategoryId: string;
  price: string | number;
  isActive?: boolean;
  sizeCategory?: { id: string; name: string };
};
export type PlanVehicleSizePricePayload = {
  sizeCategoryId: string;
  price: number;
  isActive?: boolean;
};

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getPlans() {
  const response = await api.get<ApiEnvelope<PlanItem[]>>("/plans");
  return unwrap(response.data);
}

export async function createPlan(payload: PlanPayload) {
  const response = await api.post<ApiEnvelope<PlanItem>>("/plans", payload);
  return unwrap(response.data);
}

export async function updatePlan(id: string, payload: Partial<PlanPayload>) {
  const response = await api.put<ApiEnvelope<PlanItem>>(`/plans/${id}`, payload);
  return unwrap(response.data);
}

export async function setPlanActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<PlanItem>>(`/plans/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}

export async function getPlanVehicleSizePrices(planId: string) {
  const response = await api.get<ApiEnvelope<PlanVehicleSizePrice[]>>(`/plans/${planId}/vehicle-size-prices`);
  return unwrap(response.data);
}

export async function createPlanVehicleSizePrice(planId: string, payload: PlanVehicleSizePricePayload) {
  const response = await api.post<ApiEnvelope<PlanVehicleSizePrice>>(`/plans/${planId}/vehicle-size-prices`, payload);
  return unwrap(response.data);
}

export async function updatePlanVehicleSizePrice(planId: string, id: string, payload: PlanVehicleSizePricePayload) {
  const response = await api.put<ApiEnvelope<PlanVehicleSizePrice>>(`/plans/${planId}/vehicle-size-prices/${id}`, payload);
  return unwrap(response.data);
}

export async function setPlanVehicleSizePriceActive(planId: string, id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<PlanVehicleSizePrice>>(`/plans/${planId}/vehicle-size-prices/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}
