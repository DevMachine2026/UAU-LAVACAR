import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type ReadingField = {
  id: string;
  name: string;
  key: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type OperationalShift = {
  id: string;
  unitId: string;
  status: "OPEN" | "CLOSED" | "CANCELED" | string;
  openedAt?: string;
  closedAt?: string | null;
  openingNotes?: string | null;
  closingNotes?: string | null;
  unit?: { id?: string; name?: string };
  attendances?: VehicleAttendance[];
  readings?: Array<{ fieldId: string; openingValue?: number | string; closingValue?: number | string; field?: ReadingField }>;
  closure?: DailyCashClosure | null;
  [key: string]: unknown;
};

export type VehicleAttendance = {
  id: string;
  plate?: string;
  type?: string;
  status?: string;
  source?: string;
  amountPaid?: number | string;
  cashbackUsed?: number | string;
  entryAt?: string;
  exitAt?: string | null;
  notes?: string | null;
};

export type LiveSummary = {
  totalAttendances?: number;
  completedAttendances?: number;
  totalByType?: Record<string, number>;
  totalByPayment?: Record<string, number | string>;
  grossAmount?: number | string;
  netAmount?: number | string;
  productionByType?: Record<string, number>;
  peakByHour?: Record<string, number>;
};

export type DailyCashClosure = {
  id?: string;
  totalAttendances?: number;
  machineProductionTotal?: number | string;
  systemAttendanceTotal?: number | string;
  divergence?: number | string;
};

export type OpenShiftPayload = {
  unitId: string;
  openingNotes?: string;
  openingReadings: Array<{ fieldId: string; openingValue: number }>;
};

export type ManualAttendancePayload = {
  shiftId: string;
  plate: string;
  type: "PLAN" | "AVULSO" | "COURTESY" | "PARTNER" | "BLOCKED" | "UNKNOWN";
  paymentMethod?: "PIX" | "CREDIT_CARD" | "CASHBACK";
  amountPaid?: number;
  cashbackUsed?: number;
  notes?: string;
  status?: "ENTERED" | "IN_SERVICE" | "COMPLETED" | "CANCELED" | "BLOCKED";
};

export type CloseShiftPayload = {
  closingNotes?: string;
  closingReadings: Array<{ fieldId: string; closingValue: number }>;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getReadingFields() {
  const response = await api.get<ApiEnvelope<ReadingField[]>>("/operational/reading-fields");
  return unwrap(response.data);
}

export async function openShift(payload: OpenShiftPayload) {
  const response = await api.post<ApiEnvelope<OperationalShift>>("/operational/shifts/open", payload);
  return unwrap(response.data);
}

export async function createManualAttendance(payload: ManualAttendancePayload) {
  const response = await api.post<ApiEnvelope<VehicleAttendance>>("/operational/attendances/manual", payload);
  return unwrap(response.data);
}

export async function getLiveSummary(shiftId: string) {
  const response = await api.get<ApiEnvelope<LiveSummary>>(`/operational/shifts/${shiftId}/live-summary`);
  return unwrap(response.data);
}

export async function completeAttendance(id: string) {
  const response = await api.patch<ApiEnvelope<VehicleAttendance>>(`/operational/attendances/${id}/complete`);
  return unwrap(response.data);
}

export async function cancelAttendance(id: string) {
  const response = await api.patch<ApiEnvelope<VehicleAttendance>>(`/operational/attendances/${id}/cancel`);
  return unwrap(response.data);
}

export async function closeShift(shiftId: string, payload: CloseShiftPayload) {
  const response = await api.post<ApiEnvelope<DailyCashClosure>>(`/operational/shifts/${shiftId}/close`, payload);
  return unwrap(response.data);
}

export async function getShifts() {
  const response = await api.get<ApiEnvelope<OperationalShift[]>>("/operational/shifts");
  return unwrap(response.data);
}

export async function getShiftById(id: string) {
  const response = await api.get<ApiEnvelope<OperationalShift>>(`/operational/shifts/${id}`);
  return unwrap(response.data);
}
