import axios, { AxiosError } from "axios";
import { getAuthAccessToken, handleUnauthorizedSession } from "@/auth/auth-session";

const defaultBaseUrl = "http://localhost:3000/api/v1";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? defaultBaseUrl,
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
  (error: AxiosError<{ success?: false; error?: { message?: string } }>) => {
    if (error.response?.status === 401) {
      handleUnauthorizedSession();
    }
    const message = error.response?.data?.error?.message ?? error.message ?? "Erro ao comunicar com a API UAU+";
    return Promise.reject(new Error(message));
  }
);
