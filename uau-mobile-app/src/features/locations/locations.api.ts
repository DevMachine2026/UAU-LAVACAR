import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type LocationItem = {
  id: string;
  name: string;
  stateId?: string;
  cityId?: string;
  isActive?: boolean;
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getStates() {
  const response = await api.get<ApiEnvelope<LocationItem[] | { items?: LocationItem[]; data?: LocationItem[] }>>("/states");
  return unwrap(response.data);
}

export async function getCitiesByState(stateId: string) {
  const response = await api.get<ApiEnvelope<LocationItem[] | { items?: LocationItem[]; data?: LocationItem[] }>>(
    `/states/${stateId}/cities`
  );
  const cities = unwrap(response.data);
  return normalizeList(cities).map((city) => ({
    ...asRecord(city),
    stateId: asRecord(city).stateId ?? stateId
  })) as LocationItem[];
}

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const items = record.items ?? record.data;
  return Array.isArray(items) ? (items as T[]) : [];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

/** Agrega cidades de todos os estados (API não expõe GET /cities). */
export async function getCities() {
  const states = normalizeList<LocationItem>(await getStates());
  const cityGroups = await Promise.all(states.map((state) => getCitiesByState(state.id)));
  return cityGroups.flat();
}

export async function getFranchiseUnits() {
  const response = await api.get<ApiEnvelope<LocationItem[] | { items?: LocationItem[]; data?: LocationItem[] }>>(
    "/franchise-units"
  );
  return unwrap(response.data);
}
