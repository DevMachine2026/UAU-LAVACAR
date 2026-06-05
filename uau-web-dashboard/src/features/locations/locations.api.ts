import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type StateItem = { id: string; name: string; code: string; isActive?: boolean };
export type CityItem = { id: string; name: string; stateId: string; isActive?: boolean; state?: StateItem };
export type UnitItem = {
  id: string;
  name: string;
  stateId: string;
  cityId: string;
  address: string;
  neighborhood: string;
  zipCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isOwnedUnit?: boolean;
  isFranchiseUnit?: boolean;
  franchiseOwnerName?: string | null;
  isActive?: boolean;
  state?: StateItem;
  city?: CityItem;
};

export type StatePayload = Omit<StateItem, "id">;
export type CityPayload = { name: string; stateId: string; isActive?: boolean };
export type UnitPayload = Omit<UnitItem, "id" | "state" | "city">;

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getStates() {
  const response = await api.get<ApiEnvelope<StateItem[]>>("/states");
  return unwrap(response.data);
}

export async function createState(payload: StatePayload) {
  const response = await api.post<ApiEnvelope<StateItem>>("/states", payload);
  return unwrap(response.data);
}

export async function updateState(id: string, payload: Partial<StatePayload>) {
  const response = await api.put<ApiEnvelope<StateItem>>(`/states/${id}`, payload);
  return unwrap(response.data);
}

export async function setStateActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<StateItem>>(`/states/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}

export async function getCities() {
  const states = await getStates();
  const cityGroups = await Promise.all(
    states.map(async (state) => {
      const response = await api.get<ApiEnvelope<CityItem[]>>(`/states/${state.id}/cities`);
      const cities = unwrap(response.data);
      return cities.map((city) => ({ ...city, stateId: city.stateId ?? state.id, state }));
    }),
  );
  return cityGroups.flat();
}

export async function createCity(payload: CityPayload) {
  const response = await api.post<ApiEnvelope<CityItem>>("/cities", payload);
  return unwrap(response.data);
}

export async function updateCity(id: string, payload: Partial<CityPayload>) {
  const response = await api.put<ApiEnvelope<CityItem>>(`/cities/${id}`, payload);
  return unwrap(response.data);
}

export async function setCityActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<CityItem>>(`/cities/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}

export async function getUnits() {
  const response = await api.get<ApiEnvelope<UnitItem[]>>("/franchise-units");
  return unwrap(response.data);
}

export async function createUnit(payload: UnitPayload) {
  const response = await api.post<ApiEnvelope<UnitItem>>("/franchise-units", payload);
  return unwrap(response.data);
}

export async function updateUnit(id: string, payload: Partial<UnitPayload>) {
  const response = await api.put<ApiEnvelope<UnitItem>>(`/franchise-units/${id}`, payload);
  return unwrap(response.data);
}

export async function setUnitActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<UnitItem>>(`/franchise-units/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}
