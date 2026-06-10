'use client'

import { create } from 'zustand'
import { ApiUser } from '@/api/types'
import { configureAuthSession } from '@/auth/auth-session'
import { loginRequest } from '@/auth/auth.api'

type AuthState = {
  accessToken: string | null
  user: ApiUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<ApiUser>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

function roleHome(role?: string) {
  if (role === 'SUPER_ADMIN') return '/admin'
  if (role === 'FRANCHISE_OWNER') return '/franchise'
  if (role === 'PARTNER') return '/partner'
  if (role === 'OPERATOR') return '/operator'
  return '/login'
}

export const getRoleHome = roleHome

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,

  async login(email, password) {
    set({ isLoading: true })
    try {
      const result = await loginRequest(email, password)
      set({ accessToken: result.accessToken, user: result.user, isAuthenticated: true, isLoading: false })
      return result.user
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  },

  async logout() {
    await fetch('/api/auth', { method: 'DELETE' }).catch(() => {})
    set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false })
    window.location.href = '/login'
  },

  async restoreSession() {
    try {
      const response = await fetch('/api/auth/session')
      if (!response.ok) {
        set({ isLoading: false })
        return
      }
      const envelope = await response.json()
      if (!envelope.success) {
        set({ isLoading: false })
        return
      }
      const { accessToken, user } = envelope.data
      set({ accessToken, user, isAuthenticated: true, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },
}))

configureAuthSession({
  getAccessToken: () => useAuthStore.getState().accessToken,
  onUnauthorized: () => useAuthStore.getState().logout(),
})
