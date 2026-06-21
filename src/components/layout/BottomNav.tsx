'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Dumbbell, UtensilsCrossed, ShoppingBag, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home',    icon: LayoutDashboard },
  { href: '/workout',   label: 'Workout', icon: Dumbbell },
  { href: '/diet',      label: 'Diet',    icon: UtensilsCrossed },
  { href: '/shop',      label: 'Shop',    icon: ShoppingBag },
  { href: '/profile',   label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[rgb(var(--card))] border-t border-[rgb(var(--border))] lg:hidden">
      <div className="flex items-stretch h-16 pb-safe">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                active ? 'text-emerald-500' : 'text-[rgb(var(--muted-foreground))]'
              )}
            >
              <div className={cn(
                'w-8 h-8 flex items-center justify-center rounded-xl transition-colors',
                active && 'bg-emerald-50 dark:bg-emerald-900/30'
              )}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
