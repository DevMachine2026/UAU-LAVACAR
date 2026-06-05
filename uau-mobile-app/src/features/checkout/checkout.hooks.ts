import { useMutation } from "@tanstack/react-query";
import {
  confirmSubscription,
  previewSubscription,
  SubscriptionCheckoutPayload
} from "@/features/checkout/checkout.api";

export function useSubscriptionPreview() {
  return useMutation({ mutationFn: previewSubscription });
}

export function useSubscriptionConfirm() {
  return useMutation({ mutationFn: confirmSubscription });
}

export type { SubscriptionCheckoutPayload };
