import { Plus, Trash2, MessageSquare } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime, truncate } from '@/utils/helpers'
import type { ChatSession } from '@/types/chat'

interface ChatSidebarProps {
  sessions: ChatSession[]
  activeId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

export function ChatSidebar({ sessions, activeId, onSelect, onNew, onDelete }: ChatSidebarProps) {
  return (
    <div className="flex h-full w-64 flex-shrink-0 flex-col border-r border-surface-700 bg-surface-900">
      <div className="flex items-center justify-between border-b border-surface-700 px-4 py-3">
        <span className="text-sm font-semibold text-white">Conversations</span>
        <Button variant="primary" size="sm" onClick={onNew} className="h-7 gap-1 px-2 py-0 text-xs">
          <Plus className="h-3.5 w-3.5" /> New
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-surface-600 mb-2" />
            <p className="text-sm text-surface-400">No conversations yet</p>
            <p className="text-xs text-surface-500 mt-1">Start a new chat</p>
          </div>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelect(session.id)}
            className={cn(
              'group flex cursor-pointer items-start gap-2 rounded-lg p-2.5 transition-all',
              activeId === session.id
                ? 'bg-brand-600/15 border border-brand-500/20'
                : 'hover:bg-surface-800 border border-transparent'
            )}
          >
            <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-surface-500" />
            <div className="min-w-0 flex-1">
              <p className={cn(
                'truncate text-sm font-medium',
                activeId === session.id ? 'text-white' : 'text-surface-300'
              )}>
                {session.title || 'New Chat'}
              </p>
              <p className="text-[10px] text-surface-500 mt-0.5">
                {formatRelativeTime(session.updated_at)}
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(session.id) }}
              className="mt-0.5 text-surface-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400 flex-shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
