import { create } from 'zustand'
import type { ChatSession, ChatMessage } from '@/types/chat'

interface ChatState {
  sessions: ChatSession[]
  activeSessionId: string | null
  messages: Record<string, ChatMessage[]>
  streamingContent: string
  isStreaming: boolean

  setSessions: (sessions: ChatSession[]) => void
  addSession: (session: ChatSession) => void
  updateSession: (session: ChatSession) => void
  removeSession: (id: string) => void
  setActiveSession: (id: string | null) => void
  setMessages: (sessionId: string, messages: ChatMessage[]) => void
  appendMessage: (sessionId: string, message: ChatMessage) => void
  setStreamingContent: (content: string) => void
  appendStreamingContent: (chunk: string) => void
  setIsStreaming: (v: boolean) => void
  clearStreaming: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  activeSessionId: null,
  messages: {},
  streamingContent: '',
  isStreaming: false,

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) =>
    set((s) => ({ sessions: [session, ...s.sessions] })),
  updateSession: (session) =>
    set((s) => ({
      sessions: s.sessions.map((sess) => (sess.id === session.id ? session : sess)),
    })),
  removeSession: (id) =>
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.id !== id),
      activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
    })),
  setActiveSession: (id) => set({ activeSessionId: id }),
  setMessages: (sessionId, messages) =>
    set((s) => ({ messages: { ...s.messages, [sessionId]: messages } })),
  appendMessage: (sessionId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [sessionId]: [...(s.messages[sessionId] || []), message],
      },
    })),
  setStreamingContent: (content) => set({ streamingContent: content }),
  appendStreamingContent: (chunk) =>
    set((s) => ({ streamingContent: s.streamingContent + chunk })),
  setIsStreaming: (v) => set({ isStreaming: v }),
  clearStreaming: () => set({ streamingContent: '', isStreaming: false }),
}))
