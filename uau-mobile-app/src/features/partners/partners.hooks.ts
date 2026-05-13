import { useMutation, useQuery } from "@tanstack/react-query";
import {
  confirmPartnerTransaction,
  createPartnerQr,
  getPartnerById,
  getPartners,
  PartnerQrPayload,
  PartnerTransactionPayload,
  previewPartnerTransaction
} from "@/features/partners/partners.api";

export function usePartners() {
  return useQuery({ queryKey: ["partners"], queryFn: getPartners });
}

export function usePartner(id: string) {
  return useQuery({ queryKey: ["partners", id], queryFn: () => getPartnerById(id), enabled: Boolean(id) });
}

export function usePreviewPartnerTransaction() {
  return useMutation({
    mutationFn: ({ partnerId, payload }: { partnerId: string; payload: PartnerTransactionPayload }) =>
      previewPartnerTransaction(partnerId, payload)
  });
}

export function useConfirmPartnerTransaction() {
  return useMutation({
    mutationFn: ({ partnerId, payload }: { partnerId: string; payload: PartnerTransactionPayload }) =>
      confirmPartnerTransaction(partnerId, payload)
  });
}

export function useCreatePartnerQr() {
  return useMutation({
    mutationFn: ({ partnerId, payload }: { partnerId: string; payload: PartnerQrPayload }) => createPartnerQr(partnerId, payload)
  });
}
