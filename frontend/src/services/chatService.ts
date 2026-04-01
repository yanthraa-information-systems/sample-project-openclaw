import { api } from './api'
import { useAuthStore } from '@/store/authStore'
import type { ChatSession, ChatMessage, CreateSessionRequest, SendMessageRequest } from '@/types/chat'
import type { PaginatedResponse } from '@/types/common'

const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000'

export const chatService = {
  async createSession(data: CreateSessionRequest): Promise<ChatSession> {
    const res = await api.post<ChatSession>('/chat/sessions', data)
    return res.data
  },

  async listSessions(page = 1, pageSize = 20): Promise<PaginatedResponse<ChatSession>> {
    const res = await api.get<PaginatedResponse<ChatSession>>('/chat/sessions', {
      params: { page, page_size: pageSize },
    })
    return res.data
  },

  async getSession(id: string): Promise<ChatSession> {
    const res = await api.get<ChatSession>(`/chat/sessions/${id}`)
    return res.data
  },

  async deleteSession(id: string): Promise<void> {
    await api.delete(`/chat/sessions/${id}`)
  },

  async getMessages(sessionId: string, limit = 50): Promise<ChatMessage[]> {
    const res = await api.get<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`, {
      params: { limit },
    })
    return res.data
  },

  streamMessage(
    sessionId: string,
    request: SendMessageRequest,
    callbacks: {
      onChunk: (content: string) => void
      onDone: (messageId: string, tokens: number) => void
      onError: (error: string) => void
    }
  ): AbortController {
    const controller = new AbortController()
    const token = useAuthStore.getState().accessToken

    fetch(`${BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          callbacks.onError(`HTTP ${response.status}`)
          return
        }
        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6).trim()
            if (!data) continue

            try {
              const chunk = JSON.parse(data)
              if (chunk.type === 'content' && chunk.content) {
                callbacks.onChunk(chunk.content)
              } else if (chunk.type === 'done') {
                callbacks.onDone(chunk.message_id || '', chunk.tokens_used || 0)
              } else if (chunk.type === 'error') {
                callbacks.onError(chunk.error || 'Unknown error')
              }
            } catch {
              // Skip malformed SSE data
            }
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          callbacks.onError(String(err))
        }
      })

    return controller
  },
}
