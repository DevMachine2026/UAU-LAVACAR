import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { create } from "zustand";
import { ApiUser, RegisterCustomerPayload } from "@/api/types";
import { api } from "@/api/client";
import { configureAuthSession } from "@/auth/auth-session";
import { getMe, login as loginApi, registerCustomer } from "@/features/auth/auth.api";

const ACCESS_TOKEN_KEY = "uau.accessToken";
const USER_KEY = "uau.user";

function secureGet(key: string): Promise<string | null> {
  return Promise.race([
    SecureStore.getItemAsync(key),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
  ]);
}

type AuthState = {
  accessToken: string | null;
  user: ApiUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterCustomerPayload) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateUser: (partial: Partial<ApiUser>) => void;
};

async function persistSession(accessToken: string, user: ApiUser) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

async function clearSession() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  async login(email, password) {
    const result = await loginApi(email, password);
    await persistSession(result.accessToken, result.user);
    set({ accessToken: result.accessToken, user: result.user, isAuthenticated: true });
  },

  async register(payload) {
    await registerCustomer(payload);
    const result = await loginApi(payload.email, payload.password);
    await persistSession(result.accessToken, result.user);
    set({ accessToken: result.accessToken, user: result.user, isAuthenticated: true });
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // silencioso — logout local prossegue mesmo se o backend falhar
    }
    await clearSession();
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
    router.replace("/(auth)/login");
  },

  async restoreSession() {
    try {
      console.log("[auth] restoreSession start");
      set({ isLoading: true });
      const accessToken = await secureGet(ACCESS_TOKEN_KEY);
      console.log("[auth] accessToken:", accessToken ? "found" : "null");

      if (!accessToken) {
        set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const cachedUser = await secureGet(USER_KEY);
      if (!cachedUser) {
        await clearSession();
        set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const user = JSON.parse(cachedUser) as ApiUser;
      set({ accessToken, user, isAuthenticated: true, isLoading: false });
      // fire-and-forget: não bloqueia a splash enquanto a API responde
      getMe()
        .then(async (fresh) => {
          await SecureStore.setItemAsync(USER_KEY, JSON.stringify(fresh));
          set({ user: fresh });
        })
        .catch(() => {});
    } catch {
      // Qualquer falha inesperada do SecureStore ou keystore → vai para login
      await clearSession().catch(() => {});
      set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  async refreshMe() {
    const user = await getMe();
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  updateUser(partial) {
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, ...partial };
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated)).catch(() => {});
      return { user: updated };
    });
  },
}));

configureAuthSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    void useAuthStore.getState().logout();
  }
});
