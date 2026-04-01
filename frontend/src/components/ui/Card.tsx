import { cn } from '@/utils/helpers'

interface CardProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  hover?: boolean
}

export function Card({ className, children, onClick, hover }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-surface-700 bg-surface-800 p-5',
        hover && 'cursor-pointer hover:border-surface-600 hover:bg-surface-750 transition-colors duration-150',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h3 className={cn('text-base font-semibold text-white', className)}>{children}</h3>
}

export function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('', className)}>{children}</div>
}
