"use client";

import { create } from "zustand";
import { ApiUser } from "@/api/types";
import { configureAuthSession } from "@/auth/auth-session";
import { loginRequest } from "@/auth/auth.api";

const TOKEN_KEY = "uau.web.accessToken";
const USER_KEY = "uau.web.user";

type AuthState = {
  accessToken: string | null;
  user: ApiUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<ApiUser>;
  logout: () => void;
  restoreSession: () => void;
};

function roleHome(role?: string) {
  if (role === "SUPER_ADMIN") return "/admin";
  if (role === "FRANCHISE_OWNER") return "/franchise";
  if (role === "PARTNER") return "/partner";
  if (role === "OPERATOR") return "/operator";
  return "/login";
}

export const getRoleHome = roleHome;

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  async login(email, password) {
    set({ isLoading: true });
    try {
      const result = await loginRequest(email, password);
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(result.user));
      set({ accessToken: result.accessToken, user: result.user, isAuthenticated: true, isLoading: false });
      return result.user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
    window.location.href = "/login";
  },

  restoreSession() {
    const accessToken = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);
    const user = userJson ? (JSON.parse(userJson) as ApiUser) : null;
    set({ accessToken, user, isAuthenticated: Boolean(accessToken && user), isLoading: false });
  }
}));

configureAuthSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().logout()
});
