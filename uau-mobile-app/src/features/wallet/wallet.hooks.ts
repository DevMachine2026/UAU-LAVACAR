import { useQuery } from "@tanstack/react-query";
import { getMyStatement, getMyWallet } from "@/features/wallet/wallet.api";

export function useMyWallet() {
  return useQuery({ queryKey: ["wallet", "me"], queryFn: getMyWallet });
}

export function useMyStatement() {
  return useQuery({ queryKey: ["wallet", "statement"], queryFn: getMyStatement });
}
