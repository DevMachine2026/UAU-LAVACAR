import { useQuery } from "@tanstack/react-query";
import { getActiveCampaigns } from "@/features/campaigns/campaigns.api";

export function useActiveCampaigns() {
  return useQuery({ queryKey: ["campaigns", "active"], queryFn: getActiveCampaigns });
}
