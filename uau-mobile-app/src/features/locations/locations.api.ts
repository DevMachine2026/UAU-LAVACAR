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

export async function getCities() {
  const response = await api.get<ApiEnvelope<LocationItem[] | { items?: LocationItem[]; data?: LocationItem[] }>>("/cities");
  return unwrap(response.data);
}

export async function getFranchiseUnits() {
  const response = await api.get<ApiEnvelope<LocationItem[] | { items?: LocationItem[]; data?: LocationItem[] }>>(
    "/franchise-units"
  );
  return unwrap(response.data);
}
