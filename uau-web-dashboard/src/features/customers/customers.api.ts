import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type CustomerStatus = "ACTIVE" | "BLOCKED" | "SUSPECT" | "INACTIVE" | string;

export type CustomerFilters = {
  name?: string;
  cpf?: string;
  phone?: string;
  status?: string;
  unitId?: string;
  subscription?: string;
};

export type Customer = {
  id: string;
  userId?: string;
  user?: { id: string; name?: string; email?: string; status?: string };
  name?: string;
  fullName?: string;
  email?: string;
  cpf?: string;
  document?: string;
  phone?: string;
  status?: CustomerStatus;
  defaultUnitId?: string | null;
  defaultUnit?: { id: string; name: string } | null;
  unit?: { id: string; name: string } | null;
  subscriptionStatus?: string | null;
  subscription?: Subscription | null;
  wallet?: Wallet | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CustomerPayload = Partial<{
  name: string;
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  status: string;
  defaultUnitId: string | null;
}>;

export type Vehicle = {
  id: string;
  userId?: string;
  customerId?: string;
  plate?: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: number;
  isActive?: boolean;
};

export type Subscription = {
  id: string;
  userId?: string;
  planId?: string;
  plan?: { id: string; name: string; price?: number };
  status?: string;
  baseAmount?: number;
  amount?: number;
  nextDueDate?: string;
  startedAt?: string;
  canceledAt?: string | null;
};

export type BillingHistoryItem = {
  id: string;
  subscriptionId?: string;
  status?: string;
  amount?: number;
  baseAmount?: number;
  cashbackUsed?: number;
  gatewayAmount?: number;
  asaasStatus?: string | null;
  dueDate?: string;
  paidAt?: string | null;
  createdAt?: string;
};

export type Wallet = {
  userId?: string;
  balance?: number | string;
  promoBalance?: number | string;
  availableBalance?: number;
  promotionalBalance?: number;
  blockedBalance?: number;
  totalBalance?: number;
  movements?: WalletStatementItem[];
};

export type WalletStatementItem = {
  id: string;
  type?: string;
  source?: string;
  amount?: number;
  balanceAfter?: number;
  description?: string | null;
  createdAt?: string;
};

export type WashHistoryItem = {
  id: string;
  plate?: string;
  type?: string;
  source?: string;
  status?: string;
  unit?: { id: string; name: string };
  unitId?: string;
  usedAt?: string;
  createdAt?: string;
};

export type ReferralSummary = Record<string, unknown>;
export type ReferralTree = Record<string, unknown>;
export type ListResult<T> = T[] | { items?: T[]; data?: T[]; total?: number };

function unwrap<T>(envelope: ApiEnvelope<T>) {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export function listItems<T>(value?: ListResult<T>) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return value.items ?? value.data ?? [];
}

export async function getCustomers(filters?: CustomerFilters) {
  const response = await api.get<ApiEnvelope<ListResult<Customer>>>("/customers", { params: filters });
  return unwrap(response.data);
}

export async function getCustomer(id: string) {
  const response = await api.get<ApiEnvelope<Customer>>(`/customers/${id}`);
  return unwrap(response.data);
}

export async function updateCustomer(id: string, payload: CustomerPayload) {
  const response = await api.put<ApiEnvelope<Customer>>(`/customers/${id}`, payload);
  return unwrap(response.data);
}

export async function activateCustomer(id: string) {
  const response = await api.patch<ApiEnvelope<Customer>>(`/customers/${id}/activate`);
  return unwrap(response.data);
}

export async function blockCustomer(id: string) {
  const response = await api.patch<ApiEnvelope<Customer>>(`/customers/${id}/block`);
  return unwrap(response.data);
}

export async function markCustomerSuspect(id: string) {
  const response = await api.patch<ApiEnvelope<Customer>>(`/customers/${id}/mark-suspect`);
  return unwrap(response.data);
}

export async function getVehicles(userId?: string) {
  const response = await api.get<ApiEnvelope<ListResult<Vehicle>>>("/vehicles", { params: userId ? { userId } : undefined });
  return unwrap(response.data);
}

export async function getWallet(customerId: string) {
  const response = await api.get<ApiEnvelope<Wallet>>(`/wallet/customer/${customerId}`);
  const wallet = unwrap(response.data);
  const balance = Number(wallet.balance ?? 0);
  const promoBalance = Number(wallet.promoBalance ?? 0);
  const blockedBalance = Number(wallet.blockedBalance ?? 0);

  return {
    ...wallet,
    balance,
    promoBalance,
    blockedBalance,
    availableBalance: balance,
    promotionalBalance: promoBalance,
    totalBalance: balance + promoBalance + blockedBalance,
  };
}

export async function getWalletStatement(customerId: string) {
  const wallet = await getWallet(customerId);
  const movements = (wallet as Wallet & { movements?: WalletStatementItem[] }).movements ?? [];
  return listItems(movements);
}

export async function getBillingHistory(customerId: string) {
  const customer = await getCustomer(customerId);
  const userId = (customer as Customer & { userId?: string; user?: { id: string } }).userId ?? customer.user?.id;
  if (!userId) return [];

  const response = await api.get<ApiEnvelope<ListResult<BillingHistoryItem> | BillingHistoryItem[]>>(
    "/billing/customer-history",
    { params: { userId } },
  );
  return listItems(unwrap(response.data));
}

export async function getWashHistory(customerId: string) {
  const customer = await getCustomer(customerId);
  const userId = (customer as Customer & { userId?: string; user?: { id: string } }).userId ?? customer.user?.id;
  if (!userId) return [];

  const response = await api.get<ApiEnvelope<ListResult<WashHistoryItem> | WashHistoryItem[]>>(
    "/operational/my-attendances",
    { params: { userId } },
  );
  return listItems(unwrap(response.data));
}

export async function getFranchiseCustomers(filters?: CustomerFilters) {
  const response = await api.get<ApiEnvelope<ListResult<Customer> | Customer[]>>(
    "/franchise-dashboard/customers",
    { params: filters },
  );
  return listItems(unwrap(response.data));
}

function resolveUserId(customer: Customer) {
  return customer.userId ?? customer.user?.id;
}

export async function getReferralSummary(userId: string) {
  try {
    const response = await api.get<ApiEnvelope<ReferralSummary>>(`/referrals/summary/${userId}`);
    return unwrap(response.data);
  } catch {
    return null;
  }
}

export async function getReferralSummaryForCustomer(customerId: string) {
  const customer = await getCustomer(customerId);
  const userId = resolveUserId(customer);
  if (!userId) return null;
  return getReferralSummary(userId);
}

export async function getReferralTreeForCustomer(customerId: string): Promise<ReferralTree | null> {
  const customer = await getCustomer(customerId);
  const userId = resolveUserId(customer);
  if (!userId) return null;
  try {
    const response = await api.get<ApiEnvelope<ReferralTree>>(`/referrals/tree/${userId}`);
    return unwrap(response.data);
  } catch {
    return null;
  }
}
