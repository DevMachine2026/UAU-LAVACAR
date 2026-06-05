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

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

function buildSummaryFromEvents(events: AnprEvent[]): AnprSummary {
  const eventsByStatus: Record<string, number> = {};
  for (const event of events) {
    const status = event.status ?? "UNKNOWN";
    eventsByStatus[status] = (eventsByStatus[status] ?? 0) + 1;
  }

  return {
    totalEvents: events.length,
    authorized: eventsByStatus.AUTHORIZED ?? 0,
    blocked: eventsByStatus.BLOCKED ?? 0,
    avulso: eventsByStatus.AVULSO ?? 0,
    unknown: eventsByStatus.UNKNOWN ?? 0,
    suspect: eventsByStatus.SUSPECT ?? 0,
    eventsByStatus,
  };
}

/** Backend ainda não expõe CRUD de câmeras; retorna lista vazia para não quebrar o painel. */
export async function getAnprCameras() {
  return [] as AnprCamera[];
}

export async function simulateAnprEvent(payload: { unitId: string; plate: string; cameraId: string }) {
  const response = await api.post<ApiEnvelope<{ eventId?: string; recognized?: boolean }>>("/anpr/webhook", {
    cameraId: payload.cameraId,
    plate: payload.plate,
    confidence: "99",
  });
  const result = unwrap(response.data);
  return {
    id: result.eventId ?? `sim-${Date.now()}`,
    unitId: payload.unitId,
    cameraId: payload.cameraId,
    plate: payload.plate,
    status: result.recognized ? "AUTHORIZED" : "UNKNOWN",
  } satisfies AnprEvent;
}

export async function getLatestAnprEvents(unitId: string) {
  const response = await api.get<ApiEnvelope<AnprEvent[]>>(`/anpr/events/${unitId}`);
  return unwrap(response.data);
}

export async function getAnprSummary(unitId: string) {
  const events = await getLatestAnprEvents(unitId);
  return buildSummaryFromEvents(events);
}
