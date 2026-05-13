import { useQuery } from "@tanstack/react-query";
import {
  getPartnerAlerts,
  getPartnerCampaigns,
  getPartnerCustomers,
  getPartnerFinancial,
  getPartnerOverview,
  getPartnerTransactions
} from "@/features/partner-dashboard/partnerDashboard.api";

export function usePartnerOverview() {
  return useQuery({ queryKey: ["partner-dashboard", "overview"], queryFn: getPartnerOverview });
}

export function usePartnerFinancial() {
  return useQuery({ queryKey: ["partner-dashboard", "financial"], queryFn: getPartnerFinancial });
}

export function usePartnerTransactions() {
  return useQuery({ queryKey: ["partner-dashboard", "transactions"], queryFn: getPartnerTransactions });
}

export function usePartnerCampaigns() {
  return useQuery({ queryKey: ["partner-dashboard", "campaigns"], queryFn: getPartnerCampaigns });
}

export function usePartnerCustomers() {
  return useQuery({ queryKey: ["partner-dashboard", "customers"], queryFn: getPartnerCustomers });
}

export function usePartnerAlerts() {
  return useQuery({ queryKey: ["partner-dashboard", "alerts"], queryFn: getPartnerAlerts });
}
