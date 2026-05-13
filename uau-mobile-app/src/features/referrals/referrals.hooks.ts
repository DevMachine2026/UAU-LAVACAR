import { useQuery } from "@tanstack/react-query";
import { getMyReferralNetwork, getMyReferralTree } from "@/features/referrals/referrals.api";

export function useMyReferralNetwork() {
  return useQuery({ queryKey: ["referrals", "me"], queryFn: getMyReferralNetwork });
}

export function useMyReferralTree() {
  return useQuery({ queryKey: ["referrals", "me", "tree"], queryFn: getMyReferralTree });
}
