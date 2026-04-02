import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import type { LoginRequest, RegisterRequest } from '@/types/auth'
import { QUERY_KEYS } from '@/utils/constants'

export function useAuth() {
  const { user, isAuthenticated, setAuth, setTokens, logout: storeLogout } = useAuthStore()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      const tokens = await authService.login(data)
      // Store token immediately so the axios interceptor sends it with getMe()
      setTokens(tokens.access_token, tokens.refresh_token)
      const me = await authService.getMe()
      return { tokens, me }
    },
    onSuccess: ({ tokens, me }) => {
      setAuth(me, tokens.access_token, tokens.refresh_token)
      toast.success(`Welcome back, ${me.username}!`)
      navigate('/dashboard')
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed'
      toast.error(msg)
    },
  })

  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      toast.success('Account created! Please log in.')
      navigate('/login')
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed'
      toast.error(msg)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      storeLogout()
      queryClient.clear()
      navigate('/login')
    },
  })

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: () => logoutMutation.mutate(),
  }
}
