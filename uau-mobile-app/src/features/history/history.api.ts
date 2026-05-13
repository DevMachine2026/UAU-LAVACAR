import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type AttendanceHistoryItem = {
  id: string;
  plate?: string | null;
  unit?: {
    id?: string;
    name?: string;
  } | null;
  type?: string;
  status?: string;
  source?: string;
  amountPaid?: number | string;
  cashbackUsed?: number | string;
  entryAt?: string;
  exitAt?: string | null;
  notes?: string | null;
  [key: string]: unknown;
};

export type AttendanceHistoryResponse = {
  items?: AttendanceHistoryItem[];
  data?: AttendanceHistoryItem[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getMyAttendances() {
  const response = await api.get<ApiEnvelope<AttendanceHistoryItem[] | AttendanceHistoryResponse>>(
    "/operational/my-attendances"
  );
  return unwrap(response.data);
}
