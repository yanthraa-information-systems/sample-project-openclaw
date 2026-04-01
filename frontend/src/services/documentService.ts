import { api } from './api'
import type { Document, DocumentSearchRequest, DocumentChunkResult } from '@/types/document'
import type { PaginatedResponse } from '@/types/common'

export const documentService = {
  async upload(file: File, projectId?: string): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file)
    const res = await api.post<Document>('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: projectId ? { project_id: projectId } : undefined,
    })
    return res.data
  },

  async list(params?: { project_id?: string; page?: number; page_size?: number }): Promise<PaginatedResponse<Document>> {
    const res = await api.get<PaginatedResponse<Document>>('/documents', { params })
    return res.data
  },

  async get(id: string): Promise<Document> {
    const res = await api.get<Document>(`/documents/${id}`)
    return res.data
  },

  async getDownloadUrl(id: string): Promise<{ url: string; expires_in: number }> {
    const res = await api.get<{ url: string; expires_in: number }>(`/documents/${id}/download-url`)
    return res.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`)
  },

  async search(data: DocumentSearchRequest): Promise<DocumentChunkResult[]> {
    const res = await api.post<DocumentChunkResult[]>('/documents/search', data)
    return res.data
  },
}
