import { FolderKanban, Users, FileText, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { formatRelativeTime } from '@/utils/helpers'
import type { Project } from '@/types/project'

interface ProjectCardProps {
  project: Project
  onEdit: (project: Project) => void
  onDelete: (id: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div
      className="group relative rounded-xl border border-surface-700 bg-surface-800 p-5 cursor-pointer hover:border-surface-600 transition-all duration-150"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      {/* Status badge */}
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 border border-brand-500/20">
          <FolderKanban className="h-5 w-5 text-brand-400" />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={project.status === 'active' ? 'success' : 'default'}>
            {project.status}
          </Badge>
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
              className="rounded p-1 text-surface-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white hover:bg-surface-700"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-8 z-10 w-40 rounded-lg border border-surface-600 bg-surface-800 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => { onEdit(project); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-300 hover:bg-surface-700 hover:text-white rounded-t-lg"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => { onDelete(project.id); setMenuOpen(false) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-700 rounded-b-lg"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <h3 className="mt-3 font-semibold text-white truncate">{project.name}</h3>
      {project.description && (
        <p className="mt-1 text-sm text-surface-400 line-clamp-2">{project.description}</p>
      )}

      <div className="mt-4 flex items-center gap-4 text-xs text-surface-500">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {project.member_count}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" /> {project.document_count}
        </span>
        <span className="ml-auto">{formatRelativeTime(project.updated_at)}</span>
      </div>
    </div>
  )
}
