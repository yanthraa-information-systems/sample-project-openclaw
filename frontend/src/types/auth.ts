export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  username: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  avatar_url: string | null
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  username: string
  full_name?: string
  password: string
}
