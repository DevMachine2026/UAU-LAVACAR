import axios, { AxiosError } from "axios";
import NetInfo from "@react-native-community/netinfo";
import { getAuthAccessToken, handleUnauthorizedSession } from "@/auth/auth-session";

const baseURL = process.env.EXPO_PUBLIC_API_URL;
if (!baseURL) {
  throw new Error("EXPO_PUBLIC_API_URL não configurado. Crie um arquivo .env na raiz do projeto com essa variável.");
}

export const api = axios.create({
  baseURL,
  timeout: 45000,
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

async function connectivityErrorMessage(error: AxiosError): Promise<string> {
  const netState = await NetInfo.fetch();
  if (netState.isConnected === false || netState.isInternetReachable === false) {
    return "Sem conexão com a internet. Verifique sua internet e tente novamente.";
  }
  if (error.code === "ECONNABORTED") {
    return "A conexão demorou para responder. Verifique sua internet e tente novamente.";
  }
  return "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ success?: false; error?: { code?: string; message?: string } }>) => {
    if (error.response?.status === 401) {
      handleUnauthorizedSession();
    }

    // Sem `error.response` = a requisição não completou (timeout ou falha de conectividade),
    // diferente de um erro retornado pelo servidor (validação, 4xx/5xx).
    if (!error.response) {
      const message = await connectivityErrorMessage(error);
      return Promise.reject(new Error(message));
    }

    const apiError = error.response?.data?.error;
    const message = apiError?.message ?? error.message ?? "Erro ao comunicar com a API UAU+";
    return Promise.reject(new Error(message));
  }
);
