import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { projectService } from '@/services/projectService'
import type { CreateProjectRequest, UpdateProjectRequest } from '@/types/project'
import { QUERY_KEYS } from '@/utils/constants'

export function useProjects() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: () => projectService.list(),
  })

  const createMutation = useMutation({
    mutationFn: (data: CreateProjectRequest) => projectService.create(data),
    onSuccess: () => {
      toast.success('Project created!')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects })
    },
    onError: () => toast.error('Failed to create project'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectService.update(id, data),
    onSuccess: () => {
      toast.success('Project updated')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects })
    },
    onError: () => toast.error('Failed to update project'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectService.delete(id),
    onSuccess: () => {
      toast.success('Project deleted')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects })
    },
    onError: () => toast.error('Failed to delete project'),
  })

  return {
    projects: data?.items || [],
    total: data?.total || 0,
    isLoading,
    createProject: createMutation.mutate,
    isCreating: createMutation.isPending,
    updateProject: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    deleteProject: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}
