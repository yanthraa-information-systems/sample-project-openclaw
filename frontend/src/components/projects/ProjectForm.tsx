import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/project'

interface ProjectFormProps {
  project?: Project
  onSubmit: (data: CreateProjectRequest | UpdateProjectRequest) => void
  onCancel: () => void
  isLoading: boolean
}

export function ProjectForm({ project, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const [name, setName] = useState(project?.name || '')
  const [description, setDescription] = useState(project?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({ name: name.trim(), description: description.trim() || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Project Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My awesome project"
        required
      />
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-surface-300">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this project about?"
          rows={3}
          className="block w-full rounded-lg border border-surface-700 bg-surface-800 px-4 py-2.5 text-sm text-white placeholder-surface-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading} className="flex-1">
          {project ? 'Update' : 'Create'} Project
        </Button>
      </div>
    </form>
  )
}
