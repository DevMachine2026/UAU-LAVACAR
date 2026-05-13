import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type FinancialOverview = {
  subscriptionRevenue?: number;
  partnerCommissionRevenue?: number;
  totalCashbackIssued?: number;
  totalCashbackUsed?: number;
  totalCashbackExpired?: number;
  floatInCirculation?: number;
  estimatedFranchiseShare?: number;
  estimatedUauShare?: number;
  marketingFundAmount?: number;
};

export type FinancialFloat = {
  totalAvailableBalance?: number;
  totalPromotionalBalance?: number;
  totalBlockedBalance?: number;
  totalCashbackInCirculation?: number;
  totalCashbackIssued?: number;
  totalCashbackUsed?: number;
  totalCashbackExpired?: number;
};

export type LedgerFilters = {
  startDate?: string;
  endDate?: string;
  unitId?: string;
  userId?: string;
  partnerId?: string;
  type?: string;
  source?: string;
  page?: number;
  limit?: number;
};

export type LedgerEntry = {
  id: string;
  createdAt?: string;
  type?: string;
  source?: string;
  amount?: number;
  balanceAfter?: number;
  unitId?: string | null;
  userId?: string | null;
  partnerId?: string | null;
  description?: string | null;
  status?: string;
};

export type PaginatedResult<T> = {
  items?: T[];
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
};

export type FranchiseRule = {
  id: string;
  unitId: string;
  franchiseRevenuePercent: number;
  uauRoyaltyPercent: number;
  marketingFundPercent: number;
  unit?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
};

export type FranchiseRulePayload = {
  unitId: string;
  franchiseRevenuePercent: number;
  uauRoyaltyPercent: number;
  marketingFundPercent: number;
};

export type FranchiseReport = {
  id: string;
  unitId?: string;
  unit?: { id: string; name: string };
  periodStart?: string;
  periodEnd?: string;
  subscriptionGatewayAmount?: number;
  partnerCommissionAmount?: number;
  estimatedFranchiseShare?: number;
  estimatedUauShare?: number;
  marketingFundAmount?: number;
  cashbackUsedByCustomers?: number;
  cashbackIssued?: number;
  netEstimatedAmount?: number;
  status?: string;
  createdAt?: string;
};

export type GenerateFranchiseReportPayload = {
  unitId: string;
  periodStart: string;
  periodEnd: string;
};

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export async function getFinancialOverview() {
  const response = await api.get<ApiEnvelope<FinancialOverview>>("/financial/overview");
  return unwrap(response.data);
}

export async function getFinancialFloat() {
  const response = await api.get<ApiEnvelope<FinancialFloat>>("/financial/float");
  return unwrap(response.data);
}

export async function getFinancialLedger(filters: LedgerFilters) {
  const response = await api.get<ApiEnvelope<PaginatedResult<LedgerEntry> | LedgerEntry[]>>("/financial/ledger", {
    params: filters,
  });
  return unwrap(response.data);
}

export async function getFranchiseRules() {
  const response = await api.get<ApiEnvelope<FranchiseRule[]>>("/financial/franchise-rules");
  return unwrap(response.data);
}

export async function createFranchiseRule(payload: FranchiseRulePayload) {
  const response = await api.post<ApiEnvelope<FranchiseRule>>("/financial/franchise-rules", payload);
  return unwrap(response.data);
}

export async function updateFranchiseRule(id: string, payload: FranchiseRulePayload) {
  const response = await api.put<ApiEnvelope<FranchiseRule>>(`/financial/franchise-rules/${id}`, payload);
  return unwrap(response.data);
}

export async function getFranchiseReports() {
  const response = await api.get<ApiEnvelope<FranchiseReport[]>>("/financial/franchise-reports");
  return unwrap(response.data);
}

export async function generateFranchiseReport(payload: GenerateFranchiseReportPayload) {
  const response = await api.post<ApiEnvelope<FranchiseReport>>("/financial/franchise-reports/generate", payload);
  return unwrap(response.data);
}

export async function closeFranchiseReport(id: string) {
  const response = await api.post<ApiEnvelope<FranchiseReport>>(`/financial/franchise-reports/${id}/close`);
  return unwrap(response.data);
}
