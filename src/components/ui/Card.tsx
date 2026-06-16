import { cn } from '@/lib/utils'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ className, hover, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm',
        hover && 'hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pb-0', className)} {...props}>{children}</div>
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props}>{children}</div>
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-semibold text-[rgb(var(--foreground))]', className)} {...props}>
      {children}
    </h3>
  )
}
