import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type ReferralNetwork = {
  referralCode?: string;
  referralLink?: string;
  isQualified?: boolean;
  qualified?: boolean;
  qualificationStatus?: string;
  line1?: unknown[];
  line2?: unknown[];
  line3?: unknown[];
  totals?: Record<string, unknown>;
  earnings?: Record<string, unknown>;
  [key: string]: unknown;
};

export type ReferralTree = {
  id?: string;
  name?: string;
  referralCode?: string;
  children?: ReferralTree[];
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getMyReferralNetwork() {
  const response = await api.get<ApiEnvelope<ReferralNetwork>>("/referrals/me");
  return unwrap(response.data);
}

export async function getMyReferralTree() {
  const response = await api.get<ApiEnvelope<ReferralTree>>("/referrals/me/tree");
  return unwrap(response.data);
}
