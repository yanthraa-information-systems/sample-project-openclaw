import { Bell, Search } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface TopbarProps {
  title: string
  actions?: React.ReactNode
}

export function Topbar({ title, actions }: TopbarProps) {
  const user = useAuthStore((s) => s.user)

  return (
    <header className="flex h-16 items-center justify-between border-b border-surface-700 bg-surface-900/50 px-6 backdrop-blur-sm">
      <h1 className="text-xl font-semibold text-white">{title}</h1>

      <div className="flex items-center gap-3">
        {actions}
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4 text-surface-400" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
        </Button>
        {user && <Avatar name={user.full_name || user.username} src={user.avatar_url} size="sm" />}
      </div>
    </header>
  )
}
