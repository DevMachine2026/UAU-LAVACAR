import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type AnprCamera = {
  id: string;
  unitId: string;
  name: string;
  provider?: string;
  streamUrl?: string | null;
  isActive?: boolean;
};

export type AnprEvent = {
  id: string;
  unitId?: string;
  cameraId?: string;
  plate?: string;
  normalizedPlate?: string;
  status?: "AUTHORIZED" | "BLOCKED" | "AVULSO" | "UNKNOWN" | "SUSPECT" | string;
  confidence?: number;
  capturedAt?: string;
  createdAt?: string;
  reason?: string | null;
};

export type AnprSummary = {
  totalEvents?: number;
  authorized?: number;
  blocked?: number;
  avulso?: number;
  unknown?: number;
  suspect?: number;
  eventsByStatus?: Record<string, number>;
};

export type CameraPayload = Omit<AnprCamera, "id">;

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getAnprCameras() {
  const response = await api.get<ApiEnvelope<AnprCamera[]>>("/anpr/cameras");
  return unwrap(response.data);
}

export async function createAnprCamera(payload: CameraPayload) {
  const response = await api.post<ApiEnvelope<AnprCamera>>("/anpr/cameras", payload);
  return unwrap(response.data);
}

export async function updateAnprCamera(id: string, payload: CameraPayload) {
  const response = await api.put<ApiEnvelope<AnprCamera>>(`/anpr/cameras/${id}`, payload);
  return unwrap(response.data);
}

export async function setAnprCameraActive(id: string, active: boolean) {
  const response = await api.patch<ApiEnvelope<AnprCamera>>(`/anpr/cameras/${id}/${active ? "activate" : "deactivate"}`);
  return unwrap(response.data);
}

export async function simulateAnprEvent(payload: { unitId: string; plate: string; cameraId?: string }) {
  const response = await api.post<ApiEnvelope<AnprEvent>>("/anpr/events/simulate", payload);
  return unwrap(response.data);
}

export async function getAnprEvent(id: string) {
  const response = await api.get<ApiEnvelope<AnprEvent>>(`/anpr/events/${id}`);
  return unwrap(response.data);
}

export async function getLatestAnprEvents(unitId: string) {
  const response = await api.get<ApiEnvelope<AnprEvent[]>>(`/anpr/unit/${unitId}/latest-events`);
  return unwrap(response.data);
}

export async function getAnprSummary(unitId: string) {
  const response = await api.get<ApiEnvelope<AnprSummary>>(`/anpr/unit/${unitId}/summary`);
  return unwrap(response.data);
}
