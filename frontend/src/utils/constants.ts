export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.docx', '.txt']

export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const CHAT_MODELS = [
  { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
]

export const QUERY_KEYS = {
  user: ['user'] as const,
  projects: ['projects'] as const,
  project: (id: string) => ['projects', id] as const,
  documents: ['documents'] as const,
  document: (id: string) => ['documents', id] as const,
  chatSessions: ['chat-sessions'] as const,
  chatMessages: (sessionId: string) => ['chat-messages', sessionId] as const,
  dashboardStats: ['dashboard-stats'] as const,
}
