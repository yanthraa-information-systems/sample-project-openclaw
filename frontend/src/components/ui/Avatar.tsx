import { cn } from '@/utils/helpers'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function stringToColor(str: string): string {
  const colors = [
    'bg-brand-600', 'bg-purple-600', 'bg-emerald-600',
    'bg-orange-600', 'bg-pink-600', 'bg-teal-600',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const sizes = { sm: 'h-7 w-7 text-xs', md: 'h-9 w-9 text-sm', lg: 'h-11 w-11 text-base', xl: 'h-16 w-16 text-xl' }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover ring-2 ring-surface-700', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-surface-700',
        stringToColor(name),
        sizes[size],
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
