import { useQuery } from "@tanstack/react-query";
import {
  getFranchiseAlerts,
  getFranchiseAnpr,
  getFranchiseCustomers,
  getFranchiseFinancial,
  getFranchiseOperations,
  getFranchiseOverview,
  getFranchisePartners
} from "@/features/franchise/franchise.api";

export function useFranchiseOverview() {
  return useQuery({ queryKey: ["franchise", "overview"], queryFn: getFranchiseOverview });
}

export function useFranchiseFinancial() {
  return useQuery({ queryKey: ["franchise", "financial"], queryFn: getFranchiseFinancial });
}

export function useFranchiseOperations() {
  return useQuery({ queryKey: ["franchise", "operations"], queryFn: getFranchiseOperations });
}

export function useFranchiseAnpr() {
  return useQuery({ queryKey: ["franchise", "anpr"], queryFn: getFranchiseAnpr });
}

export function useFranchisePartners() {
  return useQuery({ queryKey: ["franchise", "partners"], queryFn: getFranchisePartners });
}

export function useFranchiseCustomers() {
  return useQuery({ queryKey: ["franchise", "customers"], queryFn: getFranchiseCustomers });
}

export function useFranchiseAlerts() {
  return useQuery({ queryKey: ["franchise", "alerts"], queryFn: getFranchiseAlerts });
}
