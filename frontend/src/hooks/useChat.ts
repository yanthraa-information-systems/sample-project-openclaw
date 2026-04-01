import { useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { chatService } from '@/services/chatService'
import { useChatStore } from '@/store/chatStore'
import type { CreateSessionRequest, SendMessageRequest, ChatMessage } from '@/types/chat'
import { QUERY_KEYS } from '@/utils/constants'

function tempId() {
  return `temp-${crypto.randomUUID()}`
}

export function useChat(sessionId?: string) {
  const queryClient = useQueryClient()
  const store = useChatStore()
  const abortRef = useRef<AbortController | null>(null)

  const { data: sessions } = useQuery({
    queryKey: QUERY_KEYS.chatSessions,
    queryFn: () => chatService.listSessions(),
    select: (data) => data.items,
  })

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: QUERY_KEYS.chatMessages(sessionId || ''),
    queryFn: () => chatService.getMessages(sessionId!),
    enabled: !!sessionId,
  })

  const createSessionMutation = useMutation({
    mutationFn: (data: CreateSessionRequest) => chatService.createSession(data),
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions })
      store.setActiveSession(session.id)
    },
    onError: () => toast.error('Failed to create chat session'),
  })

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => chatService.deleteSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions })
    },
    onError: () => toast.error('Failed to delete session'),
  })

  const sendMessage = useCallback(
    (request: SendMessageRequest) => {
      if (!sessionId) return
      if (store.isStreaming) {
        abortRef.current?.abort()
      }

      const userMsg: ChatMessage = {
        id: tempId(),
        session_id: sessionId,
        role: 'user',
        content: request.content,
        tokens_used: null,
        created_at: new Date().toISOString(),
      }
      store.appendMessage(sessionId, userMsg)
      store.setIsStreaming(true)
      store.setStreamingContent('')

      abortRef.current = chatService.streamMessage(sessionId, request, {
        onChunk: (chunk) => {
          store.appendStreamingContent(chunk)
        },
        onDone: (_messageId, _tokens) => {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatMessages(sessionId) })
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions })
          store.clearStreaming()
        },
        onError: (error) => {
          toast.error(`Chat error: ${error}`)
          store.clearStreaming()
        },
      })
    },
    [sessionId, store, queryClient]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    store.clearStreaming()
  }, [store])

  return {
    sessions: sessions || [],
    messages: messages || [],
    isLoadingMessages,
    streamingContent: store.streamingContent,
    isStreaming: store.isStreaming,
    activeSessionId: store.activeSessionId,
    setActiveSession: store.setActiveSession,
    createSession: createSessionMutation.mutate,
    isCreatingSession: createSessionMutation.isPending,
    deleteSession: deleteSessionMutation.mutate,
    sendMessage,
    stopStreaming,
  }
}
