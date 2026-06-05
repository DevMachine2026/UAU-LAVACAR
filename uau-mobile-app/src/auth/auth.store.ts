import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { create } from "zustand";
import { ApiUser, RegisterCustomerPayload } from "@/api/types";
import { configureAuthSession } from "@/auth/auth-session";
import { getMe, login as loginApi, registerCustomer } from "@/features/auth/auth.api";

const ACCESS_TOKEN_KEY = "uau.accessToken";
const USER_KEY = "uau.user";

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
    set({ isLoading: true });
    try {
      const result = await loginApi(email, password);
      await persistSession(result.accessToken, result.user);
      set({
        accessToken: result.accessToken,
        user: result.user,
        isAuthenticated: true,
        isLoading: false
      });
      router.replace("/(tabs)/home");
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  async register(payload) {
    set({ isLoading: true });
    try {
      await registerCustomer(payload);
      const result = await loginApi(payload.email, payload.password);
      await persistSession(result.accessToken, result.user);
      set({
        accessToken: result.accessToken,
        user: result.user,
        isAuthenticated: true,
        isLoading: false
      });
      router.replace("/(tabs)/home");
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  async logout() {
    await clearSession();
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
    router.replace("/(auth)/login");
  },

  async restoreSession() {
    set({ isLoading: true });
    const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

    if (!accessToken) {
      set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    const cachedUser = await SecureStore.getItemAsync(USER_KEY);
    if (!cachedUser) {
      await clearSession();
      set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const user = JSON.parse(cachedUser) as ApiUser;
      set({ accessToken, user, isAuthenticated: true, isLoading: false });
      try {
        const fresh = await getMe();
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(fresh));
        set({ user: fresh });
      } catch {
        // Mantém usuário em cache até existir rota de perfil no backend.
      }
    } catch {
      await clearSession();
      set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
    }
  },

  async refreshMe() {
    const user = await getMe();
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  }
}));

configureAuthSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => {
    void useAuthStore.getState().logout();
  }
});
