export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code?: string;
    message: string;
    details?: unknown;
  };
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "FRANCHISE_OWNER" | "PARTNER" | "OPERATOR" | "CUSTOMER" | string;
  status?: string;
  defaultUnitId?: string | null;
};

export type LoginResponse = {
  accessToken: string;
  user: ApiUser;
};
