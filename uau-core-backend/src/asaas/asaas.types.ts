export type AsaasBillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD' | 'UNDEFINED';

export interface AsaasCustomerPayload {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasCustomerResponse {
  id: string;
}

export interface AsaasSubscriptionPayload {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'WEEKLY' | 'YEARLY';
  description: string;
  externalReference?: string;
}

export interface AsaasSubscriptionResponse {
  id: string;
  status?: string;
}

export interface AsaasPaymentResponse {
  id: string;
  status?: string;
  value?: number;
  dueDate?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  bankSlipBarCode?: string;
  billingType?: string;
  subscription?: string;
}

export interface AsaasPixQrCodeResponse {
  encodedImage?: string;
  payload?: string;
  expirationDate?: string;
}

export interface AsaasListResponse<T> {
  data: T[];
  hasMore?: boolean;
}
