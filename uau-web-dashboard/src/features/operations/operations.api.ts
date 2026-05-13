import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type ReadingField = { id: string; name: string; key?: string; isActive?: boolean };
export type ShiftStatus = "OPEN" | "CLOSED" | "CANCELED" | string;

export type Shift = {
  id: string;
  unitId?: string;
  unit?: { id: string; name: string };
  operatorUserId?: string;
  status?: ShiftStatus;
  openedAt?: string;
  closedAt?: string | null;
  openingNotes?: string | null;
  closingNotes?: string | null;
};

export type Attendance = {
  id: string;
  shiftId?: string;
  plate?: string;
  type?: "PLAN" | "AVULSO" | "BLOCKED" | string;
  source?: "MANUAL" | "CAMERA" | string;
  status?: "PENDING" | "COMPLETED" | "CANCELED" | string;
  amountPaid?: number;
  createdAt?: string;
  notes?: string | null;
};

export type LiveSummary = {
  totalAttendances?: number;
  totalByType?: Record<string, number>;
  totalByStatus?: Record<string, number>;
  grossAmount?: number;
  netAmount?: number;
  attendances?: Attendance[];
};

export type Closure = {
  id: string;
  shiftId?: string;
  unitId?: string;
  unit?: { id: string; name: string };
  status?: string;
  openedAt?: string;
  closedAt?: string;
  grossAmount?: number;
  netAmount?: number;
  divergenceAmount?: number;
  createdAt?: string;
};

export type PlateCheck = {
  normalizedPlate: string;
  vehicleFound: boolean;
  vehicle: { id: string; plate: string; brand?: string; model?: string; color?: string } | null;
  customer: { id: string; name: string; email: string; phone?: string } | null;
  plan: { id: string; name: string; coverageType?: string; allowedStartTime?: string | null; allowedEndTime?: string | null } | null;
  subscription: { id: string; status: string; nextDueDate?: string } | null;
  unit?: { id: string; name: string } | null;
  allowedUnit?: { id: string; name: string } | null;
  canWashToday: boolean;
  status: string;
  reason: string | null;
  lastWash: { id?: string; usedAt?: string; usageDate?: string; unit?: { name: string } } | null;
  quickHistory?: { id: string; usedAt?: string; status?: string; unit?: { name: string } }[];
  history?: { id: string; usedAt?: string; status?: string; unit?: { name: string } }[];
  nextReleaseLocal?: string;
  nextRelease?: string;
};

export type ShiftFilters = { unitId?: string; status?: string; date?: string };
export type ClosureFilters = { unitId?: string; status?: string; date?: string };

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getReadingFields() {
  const response = await api.get<ApiEnvelope<ReadingField[]>>("/operational/reading-fields");
  return unwrap(response.data);
}

export async function openShift(payload: unknown) {
  const response = await api.post<ApiEnvelope<Shift>>("/operational/shifts/open", payload);
  return unwrap(response.data);
}

export async function getShifts(filters?: ShiftFilters) {
  const response = await api.get<ApiEnvelope<Shift[]>>("/operational/shifts", { params: filters });
  return unwrap(response.data);
}

export async function getShift(id: string) {
  const response = await api.get<ApiEnvelope<Shift>>(`/operational/shifts/${id}`);
  return unwrap(response.data);
}

export async function getLiveSummary(shiftId: string) {
  const response = await api.get<ApiEnvelope<LiveSummary>>(`/operational/shifts/${shiftId}/live-summary`);
  return unwrap(response.data);
}

export async function createManualAttendance(payload: unknown) {
  const response = await api.post<ApiEnvelope<Attendance>>("/operational/attendances/manual", payload);
  return unwrap(response.data);
}

export async function completeAttendance(id: string) {
  const response = await api.patch<ApiEnvelope<Attendance>>(`/operational/attendances/${id}/complete`);
  return unwrap(response.data);
}

export async function cancelAttendance(id: string) {
  const response = await api.patch<ApiEnvelope<Attendance>>(`/operational/attendances/${id}/cancel`);
  return unwrap(response.data);
}

export async function closeShift(shiftId: string, payload: unknown) {
  const response = await api.post<ApiEnvelope<Closure>>(`/operational/shifts/${shiftId}/close`, payload);
  return unwrap(response.data);
}

export async function getClosures(filters?: ClosureFilters) {
  const response = await api.get<ApiEnvelope<Closure[]>>("/operational/closures", { params: filters });
  return unwrap(response.data);
}

export async function getClosure(id: string) {
  const response = await api.get<ApiEnvelope<Closure>>(`/operational/closures/${id}`);
  return unwrap(response.data);
}

export async function checkPlate(plate: string, unitId?: string) {
  const response = await api.get<ApiEnvelope<PlateCheck>>(`/operational/plate-check/${plate}`, { params: { unitId } });
  return unwrap(response.data);
}

export async function confirmPlateWash(plate: string, payload: { unitId: string; notes?: string }) {
  const response = await api.post<ApiEnvelope<unknown>>(`/operational/plate-check/${plate}/confirm-wash`, payload);
  return unwrap(response.data);
}

export async function cancelDailyWash(id: string) {
  const response = await api.post<ApiEnvelope<unknown>>(`/operational/daily-washes/${id}/cancel`);
  return unwrap(response.data);
}
