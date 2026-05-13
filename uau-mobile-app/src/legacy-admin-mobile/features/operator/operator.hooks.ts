import { useMutation, useQuery } from "@tanstack/react-query";
import {
  cancelAttendance,
  closeShift,
  CloseShiftPayload,
  completeAttendance,
  createManualAttendance,
  getLiveSummary,
  getReadingFields,
  getShiftById,
  getShifts,
  ManualAttendancePayload,
  openShift,
  OpenShiftPayload
} from "@/features/operator/operator.api";

export function useReadingFields() {
  return useQuery({ queryKey: ["operator", "reading-fields"], queryFn: getReadingFields });
}

export function useOperationalShifts() {
  return useQuery({ queryKey: ["operator", "shifts"], queryFn: getShifts });
}

export function useOperationalShift(id?: string) {
  return useQuery({
    queryKey: ["operator", "shifts", id],
    queryFn: () => getShiftById(id ?? ""),
    enabled: Boolean(id)
  });
}

export function useLiveSummary(shiftId?: string) {
  return useQuery({
    queryKey: ["operator", "live-summary", shiftId],
    queryFn: () => getLiveSummary(shiftId ?? ""),
    enabled: Boolean(shiftId),
    refetchInterval: 15000
  });
}

export function useOpenShift() {
  return useMutation({ mutationFn: (payload: OpenShiftPayload) => openShift(payload) });
}

export function useManualAttendance() {
  return useMutation({ mutationFn: (payload: ManualAttendancePayload) => createManualAttendance(payload) });
}

export function useCompleteAttendance() {
  return useMutation({ mutationFn: (id: string) => completeAttendance(id) });
}

export function useCancelAttendance() {
  return useMutation({ mutationFn: (id: string) => cancelAttendance(id) });
}

export function useCloseShift() {
  return useMutation({ mutationFn: ({ shiftId, payload }: { shiftId: string; payload: CloseShiftPayload }) => closeShift(shiftId, payload) });
}
