export type DocumentStatus = 'pending' | 'processing' | 'processed' | 'failed'

export interface Document {
  id: string
  filename: string
  original_filename: string
  file_type: string
  file_size: number
  status: DocumentStatus
  chunk_count: number | null
  error_message: string | null
  project_id: string | null
  uploaded_by: string
  created_at: string
  updated_at: string
}

export interface DocumentSearchRequest {
  query: string
  top_k?: number
  project_id?: string
}

export interface DocumentChunkResult {
  document_id: string
  document_name: string
  content: string
  score: number
  chunk_index: number
}
