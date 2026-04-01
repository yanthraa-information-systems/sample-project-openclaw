import { Topbar } from '@/components/layout/Topbar'
import { DocumentUpload } from '@/components/documents/DocumentUpload'
import { DocumentCard } from '@/components/documents/DocumentCard'
import { PageSpinner } from '@/components/ui/Spinner'
import { useDocuments } from '@/hooks/useDocuments'
import { FileText } from 'lucide-react'

export default function DocumentsPage() {
  const { documents, isLoading, upload, isUploading, deleteDocument } = useDocuments()

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar title="Documents" />
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <DocumentUpload
          onUpload={(file) => upload({ file })}
          isUploading={isUploading}
        />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">
              All Documents{' '}
              <span className="text-surface-400 font-normal">({documents.length})</span>
            </h3>
          </div>

          {isLoading ? (
            <PageSpinner />
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-10 w-10 text-surface-600 mb-3" />
              <p className="text-surface-400">No documents yet. Upload some files above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} onDelete={deleteDocument} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
