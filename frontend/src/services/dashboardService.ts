import { api } from './api'

export interface DashboardStats {
  total_users: number
  total_projects: number
  total_documents: number
  total_messages: number
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get<DashboardStats>('/dashboard/stats')
    return res.data
  },
}
