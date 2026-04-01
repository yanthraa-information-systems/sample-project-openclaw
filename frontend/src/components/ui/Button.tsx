import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/helpers'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-900 disabled:opacity-50 disabled:pointer-events-none'

    const variants = {
      primary: 'bg-brand-600 hover:bg-brand-700 text-white focus:ring-brand-500 shadow-sm',
      secondary: 'bg-surface-800 hover:bg-surface-700 text-white focus:ring-surface-600 border border-surface-700',
      ghost: 'hover:bg-surface-800 text-surface-300 hover:text-white focus:ring-surface-600',
      danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
      outline: 'border border-surface-600 hover:bg-surface-800 text-surface-300 hover:text-white focus:ring-surface-500',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-2.5 text-base',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
