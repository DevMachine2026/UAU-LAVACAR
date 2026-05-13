import { useQuery } from "@tanstack/react-query";
import { getMyAttendances } from "@/features/history/history.api";

export function useMyAttendances() {
  return useQuery({ queryKey: ["history", "my-attendances"], queryFn: getMyAttendances });
}
