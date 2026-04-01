import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { documentService } from '@/services/documentService'
import { QUERY_KEYS } from '@/utils/constants'

export function useDocuments(projectId?: string) {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: [...QUERY_KEYS.documents, projectId],
    queryFn: () => documentService.list({ project_id: projectId }),
  })

  const uploadMutation = useMutation({
    mutationFn: ({ file, projectId }: { file: File; projectId?: string }) =>
      documentService.upload(file, projectId),
    onSuccess: () => {
      toast.success('Document uploaded and processing started')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents })
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Upload failed'
      toast.error(msg)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentService.delete(id),
    onSuccess: () => {
      toast.success('Document deleted')
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.documents })
    },
    onError: () => toast.error('Failed to delete document'),
  })

  return {
    documents: data?.items || [],
    total: data?.total || 0,
    isLoading,
    upload: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
    deleteDocument: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  }
}
