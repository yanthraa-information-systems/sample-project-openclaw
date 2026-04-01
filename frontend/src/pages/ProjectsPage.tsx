import { useState } from 'react'
import { Plus, FolderKanban } from 'lucide-react'
import { Topbar } from '@/components/layout/Topbar'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { useProjects } from '@/hooks/useProjects'
import type { Project } from '@/types/project'

export default function ProjectsPage() {
  const { projects, isLoading, createProject, isCreating, updateProject, isUpdating, deleteProject } = useProjects()
  const [createOpen, setCreateOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Projects"
        actions={
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <PageSpinner />
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-800 border border-surface-700">
              <FolderKanban className="h-8 w-8 text-surface-500" />
            </div>
            <h3 className="text-lg font-semibold text-white">No projects yet</h3>
            <p className="mt-1 text-sm text-surface-400">Create your first project to get started</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Create Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={setEditProject}
                onDelete={deleteProject}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Project">
        <ProjectForm
          onSubmit={(data) => { createProject(data as any); setCreateOpen(false) }}
          onCancel={() => setCreateOpen(false)}
          isLoading={isCreating}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editProject} onClose={() => setEditProject(null)} title="Edit Project">
        {editProject && (
          <ProjectForm
            project={editProject}
            onSubmit={(data) => { updateProject({ id: editProject.id, data: data as any }); setEditProject(null) }}
            onCancel={() => setEditProject(null)}
            isLoading={isUpdating}
          />
        )}
      </Modal>
    </div>
  )
}
