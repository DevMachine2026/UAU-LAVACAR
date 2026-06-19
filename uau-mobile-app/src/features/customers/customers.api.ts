import { api } from "@/api/client";
import { ApiEnvelope } from "@/api/types";

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.error.message);
  return envelope.data;
}

export type UpdateMyProfileResponse = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: string;
  customer: { phone: string } | null;
};

export async function updateMyProfile(data: {
  name?: string;
  phone?: string;
}): Promise<UpdateMyProfileResponse> {
  const res = await api.patch<ApiEnvelope<UpdateMyProfileResponse>>("/customers/me", data);
  return unwrap(res.data);
}
