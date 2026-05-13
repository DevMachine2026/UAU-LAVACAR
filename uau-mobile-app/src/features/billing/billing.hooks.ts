import { useQuery } from "@tanstack/react-query";
import { getMyBillingHistory, getMyCurrentBilling } from "@/features/billing/billing.api";

export function useMyCurrentBilling() {
  return useQuery({ queryKey: ["billing", "my-current"], queryFn: getMyCurrentBilling });
}

export function useMyBillingHistory() {
  return useQuery({ queryKey: ["billing", "my-history"], queryFn: getMyBillingHistory });
}
