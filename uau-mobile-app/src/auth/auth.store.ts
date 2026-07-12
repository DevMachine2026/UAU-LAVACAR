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
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
  ]);
}

function withTimeout<T>(operation: Promise<T>, fallback: T, timeoutMs = 1500): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), timeoutMs)),
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
  await withTimeout(SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken), undefined);
  await withTimeout(SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)), undefined);
}

async function clearSession() {
  await Promise.all([
    withTimeout(SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY), undefined),
    withTimeout(SecureStore.deleteItemAsync(USER_KEY), undefined),
  ]);
}

let isLoggingOut = false;

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
    // Reentrância: um 401 durante o próprio logout não pode disparar outro
    // logout — o router.replace repetido congelava a UI com telas sobrepostas.
    if (isLoggingOut) return;
    isLoggingOut = true;
    try {
      try {
        await api.post('/auth/logout');
      } catch {
        // silencioso — logout local prossegue mesmo se o backend falhar
      }
      await clearSession();
      set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
      router.replace("/(auth)/login");
    } finally {
      isLoggingOut = false;
    }
  },

  async restoreSession() {
    try {
      set({ isLoading: true });
      const [accessToken, cachedUser] = await Promise.all([
        secureGet(ACCESS_TOKEN_KEY),
        secureGet(USER_KEY),
      ]);

      if (!accessToken) {
        set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
        return;
      }

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
          await withTimeout(SecureStore.setItemAsync(USER_KEY, JSON.stringify(fresh)), undefined);
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
    await withTimeout(SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)), undefined);
    set({ user, isAuthenticated: true });
  },

  updateUser(partial) {
    set((state) => {
      if (!state.user) return {};
      const updated = { ...state.user, ...partial };
      withTimeout(SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated)), undefined).catch(() => {});
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
