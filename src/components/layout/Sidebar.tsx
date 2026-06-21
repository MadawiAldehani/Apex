'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Dumbbell, UtensilsCrossed,
  TrendingUp, User, LogOut, ShoppingBag, ShoppingCart,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import ThemeToggle from './ThemeToggle'

function ApexIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" fill="white" />
      <path d="M8 5.5L11.5 12H4.5L8 5.5Z" fill="#10b981" />
    </svg>
  )
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workout',   label: 'Workout',   icon: Dumbbell },
  { href: '/diet',      label: 'Diet',      icon: UtensilsCrossed },
  { href: '/progress',  label: 'Progress',  icon: TrendingUp },
  { href: '/shop',      label: 'Shop',      icon: ShoppingBag },
  { href: '/cart',      label: 'Cart',      icon: ShoppingCart },
  { href: '/profile',   label: 'Profile',   icon: User },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-[rgb(var(--card))] border-r border-[rgb(var(--border))] flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-[rgb(var(--border))]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
            <ApexIcon size={18} />
          </div>
          <div>
            <h1 className="font-bold text-[rgb(var(--foreground))] text-sm leading-none tracking-tight">Apex</h1>
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">Reach your peak</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                active
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))]'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-[rgb(var(--border))] space-y-1">
        <div className="flex items-center justify-between px-3 mb-2">
          <span className="text-xs text-[rgb(var(--muted-foreground))]">Theme</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-[rgb(var(--muted-foreground))] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
