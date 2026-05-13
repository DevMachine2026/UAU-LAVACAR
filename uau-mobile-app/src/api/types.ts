export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  phone?: string | null;
  cpf?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  defaultUnitId?: string | null;
};

export type LoginResponse = {
  accessToken: string;
  user: ApiUser;
};

export type RegisterCustomerPayload = {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  password: string;
  stateId?: string;
  cityId?: string;
  defaultUnitId?: string;
};
