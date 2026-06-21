import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type WorkingHours = {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
};

export type Equipment = {
  id: string;
  name: string;
  status: "AVAILABLE" | "UNAVAILABLE" | "MAINTENANCE";
};

export type FranchiseUnit = {
  id: string;
  name: string;
  address: string;
  neighborhood?: string;
  zipCode?: string;
  phone?: string;
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  city?: { name: string };
  state?: { uf: string };
  workingHours?: WorkingHours[];
  equipments?: Equipment[];
};

function unwrap<T>(response: ApiEnvelope<T>): T {
  if (!response.success) {
    throw new Error(response.error.message);
  }
  return response.data;
}

export async function getUnits(): Promise<FranchiseUnit[]> {
  const response = await api.get<ApiEnvelope<FranchiseUnit[]>>("/franchise-units");
  const data = unwrap(response.data);
  return Array.isArray(data) ? data : (data as any).items ?? (data as any).data ?? [];
}

export async function getUnit(id: string): Promise<FranchiseUnit> {
  const response = await api.get<ApiEnvelope<FranchiseUnit>>(`/franchise-units/${id}`);
  return unwrap(response.data);
}
