import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FolderKanban, FileText, MessageSquare,
  Bot, ChevronLeft, ChevronRight, LogOut, Settings,
} from 'lucide-react'
import { cn } from '@/utils/helpers'
import { useUIStore } from '@/store/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/chat', icon: MessageSquare, label: 'Chat' },
  { to: '/agent', icon: Bot, label: 'Agent' },
]

export function Sidebar() {
  const { collapsed, toggleSidebar } = { collapsed: useUIStore((s) => s.sidebarCollapsed), toggleSidebar: useUIStore((s) => s.toggleSidebar) }
  const { user, logout } = useAuth()

  return (
    <aside
      className={cn(
        'flex h-screen flex-col border-r border-surface-700 bg-surface-900 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b border-surface-700 px-4', collapsed && 'justify-center')}>
        {!collapsed ? (
          <span className="text-lg font-bold text-white">
            <span className="text-brand-400">AI</span> Platform
          </span>
        ) : (
          <span className="text-lg font-bold text-brand-400">AI</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-surface-400 hover:bg-surface-800 hover:text-white',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-surface-700 p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn('w-full', collapsed ? 'justify-center' : 'justify-end')}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        {/* User section */}
        {!collapsed && user && (
          <div className="mt-2 flex items-center gap-3 rounded-lg p-2">
            <Avatar name={user.full_name || user.username} src={user.avatar_url} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.full_name || user.username}</p>
              <p className="truncate text-xs text-surface-400">{user.role}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="h-7 w-7 p-0 text-surface-400 hover:text-red-400">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        {collapsed && user && (
          <div className="mt-2 flex justify-center">
            <Avatar name={user.full_name || user.username} src={user.avatar_url} size="sm" />
          </div>
        )}
      </div>
    </aside>
  )
}
