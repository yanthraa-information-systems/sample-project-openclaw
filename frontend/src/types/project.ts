export type ProjectStatus = 'active' | 'archived' | 'deleted'
export type MemberRole = 'owner' | 'editor' | 'viewer'

export interface ProjectMember {
  id: string
  user_id: string
  username: string
  full_name: string | null
  role: MemberRole
  joined_at: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  owner_id: string
  created_at: string
  updated_at: string
  member_count: number
  document_count: number
}

export interface ProjectDetail extends Project {
  members: ProjectMember[]
}

export interface CreateProjectRequest {
  name: string
  description?: string
}

export interface UpdateProjectRequest {
  name?: string
  description?: string
  status?: ProjectStatus
}
