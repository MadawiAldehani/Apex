import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        {
          'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))]': variant === 'default',
          'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': variant === 'success',
          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400': variant === 'danger',
          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': variant === 'info',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
