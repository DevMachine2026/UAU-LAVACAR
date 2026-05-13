import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

export type Plan = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string;
  monthlyPrice?: number | string;
  amount?: number | string;
  coverage?: string;
  scope?: string;
  allowedDays?: unknown;
  allowedHours?: unknown;
  isActive?: boolean;
  [key: string]: unknown;
};

function unwrap<T>(response: ApiEnvelope<T>) {
  if (!response.success) {
    throw new Error(response.error.message);
  }

  return response.data;
}

export async function getPlans() {
  const response = await api.get<ApiEnvelope<Plan[] | { items?: Plan[]; data?: Plan[] }>>("/plans");
  return unwrap(response.data);
}
