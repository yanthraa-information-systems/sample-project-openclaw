import { FileText, Trash2, Download, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatBytes, formatRelativeTime, getFileIcon } from '@/utils/helpers'
import { documentService } from '@/services/documentService'
import type { Document } from '@/types/document'

interface DocumentCardProps {
  document: Document
  onDelete: (id: string) => void
}

const statusConfig = {
  pending: { variant: 'warning' as const, icon: Clock, label: 'Pending' },
  processing: { variant: 'info' as const, icon: RefreshCw, label: 'Processing' },
  processed: { variant: 'success' as const, icon: CheckCircle2, label: 'Ready' },
  failed: { variant: 'error' as const, icon: AlertCircle, label: 'Failed' },
}

export function DocumentCard({ document, onDelete }: DocumentCardProps) {
  const status = statusConfig[document.status]
  const StatusIcon = status.icon

  const handleDownload = async () => {
    try {
      const { url } = await documentService.getDownloadUrl(document.id)
      window.open(url, '_blank')
    } catch {
      // toast handled globally
    }
  }

  return (
    <div className="flex items-center gap-4 rounded-xl border border-surface-700 bg-surface-800 p-4 hover:border-surface-600 transition-all">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-surface-700 text-xl">
        {getFileIcon(document.file_type)}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{document.original_filename}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-surface-400">
          <span>{formatBytes(document.file_size)}</span>
          {document.chunk_count != null && <span>{document.chunk_count} chunks</span>}
          <span>{formatRelativeTime(document.created_at)}</span>
        </div>
        {document.error_message && (
          <p className="mt-1 text-xs text-red-400 truncate">{document.error_message}</p>
        )}
      </div>

      <Badge variant={status.variant}>
        <StatusIcon className={`mr-1 h-3 w-3 ${document.status === 'processing' ? 'animate-spin' : ''}`} />
        {status.label}
      </Badge>

      <div className="flex items-center gap-1">
        {document.status === 'processed' && (
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-8 w-8 p-0">
            <Download className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(document.id)}
          className="h-8 w-8 p-0 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
