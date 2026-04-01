import { api } from './api'
import type { Project, ProjectDetail, CreateProjectRequest, UpdateProjectRequest } from '@/types/project'
import type { PaginatedResponse } from '@/types/common'

export const projectService = {
  async list(page = 1, pageSize = 20): Promise<PaginatedResponse<Project>> {
    const res = await api.get<PaginatedResponse<Project>>('/projects', {
      params: { page, page_size: pageSize },
    })
    return res.data
  },

  async get(id: string): Promise<ProjectDetail> {
    const res = await api.get<ProjectDetail>(`/projects/${id}`)
    return res.data
  },

  async create(data: CreateProjectRequest): Promise<Project> {
    const res = await api.post<Project>('/projects', data)
    return res.data
  },

  async update(id: string, data: UpdateProjectRequest): Promise<Project> {
    const res = await api.put<Project>(`/projects/${id}`, data)
    return res.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  },

  async addMember(projectId: string, userId: string, role: string): Promise<void> {
    await api.post(`/projects/${projectId}/members`, { user_id: userId, role })
  },

  async removeMember(projectId: string, userId: string): Promise<void> {
    await api.delete(`/projects/${projectId}/members/${userId}`)
  },
}
