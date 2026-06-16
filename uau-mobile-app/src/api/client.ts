import axios, { AxiosError } from "axios";
import { getAuthAccessToken, handleUnauthorizedSession } from "@/auth/auth-session";

const baseURL = process.env.EXPO_PUBLIC_API_URL;
if (!baseURL) {
  throw new Error("EXPO_PUBLIC_API_URL não configurado. Crie um arquivo .env na raiz do projeto com essa variável.");
}

export const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  const token = getAuthAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: false; error?: { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      handleUnauthorizedSession();
    }

    const apiError = error.response?.data?.error;
    const message = apiError?.message ?? error.message ?? "Erro ao comunicar com a API UAU+";
    return Promise.reject(new Error(message));
  }
);
