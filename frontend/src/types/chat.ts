export type MessageRole = 'user' | 'assistant' | 'system'

export interface ChatSession {
  id: string
  title: string | null
  project_id: string | null
  model: string
  message_count: number
  total_tokens: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  role: MessageRole
  content: string
  tokens_used: number | null
  created_at: string
}

export interface CreateSessionRequest {
  title?: string
  project_id?: string
  system_prompt?: string
  model?: string
}

export interface SendMessageRequest {
  content: string
  use_rag?: boolean
  project_id?: string
}

export interface StreamChunk {
  type: 'start' | 'content' | 'done' | 'error'
  content?: string
  message_id?: string
  tokens_used?: number
  error?: string
}
