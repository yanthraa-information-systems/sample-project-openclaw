import { type LucideIcon } from 'lucide-react'
import { cn } from '@/utils/helpers'

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  trend?: { value: number; label: string }
  color?: 'blue' | 'emerald' | 'purple' | 'orange'
}

const colorMap = {
  blue: { bg: 'bg-brand-500/15', icon: 'text-brand-400', border: 'border-brand-500/20' },
  emerald: { bg: 'bg-emerald-500/15', icon: 'text-emerald-400', border: 'border-emerald-500/20' },
  purple: { bg: 'bg-purple-500/15', icon: 'text-purple-400', border: 'border-purple-500/20' },
  orange: { bg: 'bg-orange-500/15', icon: 'text-orange-400', border: 'border-orange-500/20' },
}

export function StatsCard({ title, value, icon: Icon, trend, color = 'blue' }: StatsCardProps) {
  const colors = colorMap[color]

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-800 p-5 transition-all hover:border-surface-600">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-surface-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={cn('mt-1 text-xs', trend.value >= 0 ? 'text-emerald-400' : 'text-red-400')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl border p-3', colors.bg, colors.border)}>
          <Icon className={cn('h-6 w-6', colors.icon)} />
        </div>
      </div>
    </div>
  )
}
