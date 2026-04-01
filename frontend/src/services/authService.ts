import { api } from './api'
import type { User, TokenResponse, LoginRequest, RegisterRequest } from '@/types/auth'

export const authService = {
  async login(data: LoginRequest): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/auth/login', data)
    return res.data
  },

  async register(data: RegisterRequest): Promise<User> {
    const res = await api.post<User>('/auth/register', data)
    return res.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/auth/me')
    return res.data
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const res = await api.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    })
    return res.data
  },
}
