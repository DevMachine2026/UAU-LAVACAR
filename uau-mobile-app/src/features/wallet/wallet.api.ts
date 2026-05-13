import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type Wallet = {
  id?: string;
  availableBalance?: number | string;
  promotionalBalance?: number | string;
  blockedBalance?: number | string;
  totalBalance?: number | string;
  [key: string]: unknown;
};

export type WalletStatementItem = {
  id?: string;
  amount?: number | string;
  type?: string;
  origin?: string;
  description?: string | null;
  createdAt?: string;
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getMyWallet() {
  const response = await api.get<ApiEnvelope<Wallet>>("/wallet/me");
  return unwrap(response.data);
}

export async function getMyStatement() {
  const response = await api.get<ApiEnvelope<WalletStatementItem[] | { items?: WalletStatementItem[]; data?: WalletStatementItem[] }>>(
    "/wallet/me/statement"
  );
  return unwrap(response.data);
}
