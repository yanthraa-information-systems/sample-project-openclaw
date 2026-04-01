import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE_MB } from '@/utils/constants'

interface DocumentUploadProps {
  onUpload: (file: File) => void
  isUploading: boolean
  projectId?: string
}

export function DocumentUpload({ onUpload, isUploading }: DocumentUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      acceptedFiles.forEach((file) => onUpload(file))
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    disabled: isUploading,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-150',
          isDragActive && !isDragReject && 'border-brand-500 bg-brand-500/5',
          isDragReject && 'border-red-500 bg-red-500/5',
          !isDragActive && 'border-surface-600 hover:border-surface-500 hover:bg-surface-800/50',
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          <div className={cn(
            'flex h-14 w-14 items-center justify-center rounded-2xl',
            isDragReject ? 'bg-red-500/15' : 'bg-brand-500/15'
          )}>
            {isDragReject ? (
              <AlertCircle className="h-7 w-7 text-red-400" />
            ) : isUploading ? (
              <Upload className="h-7 w-7 text-brand-400 animate-bounce" />
            ) : (
              <Upload className="h-7 w-7 text-brand-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {isDragActive
                ? isDragReject
                  ? 'File not supported'
                  : 'Drop to upload'
                : isUploading
                ? 'Uploading...'
                : 'Drag & drop files here'}
            </p>
            <p className="mt-1 text-xs text-surface-400">
              or <span className="text-brand-400">browse to choose</span>
            </p>
          </div>
          <p className="text-xs text-surface-500">
            Supports {ALLOWED_FILE_EXTENSIONS.join(', ')} · Max {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
      </div>
      {fileRejections.length > 0 && (
        <div className="mt-2 space-y-1">
          {fileRejections.map(({ file, errors }) => (
            <p key={file.name} className="text-xs text-red-400">
              {file.name}: {errors.map((e) => e.message).join(', ')}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
