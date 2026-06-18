'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'
import { getGreeting } from '@/lib/utils'

function ApexIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" fill="white" />
      <path d="M8 5.5L11.5 12H4.5L8 5.5Z" fill="#10b981" />
    </svg>
  )
}

export default function MobileHeader({ userName }: { userName?: string }) {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  const handleSignOut = async () => {
    setSigningOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 bg-[rgb(var(--card))] border-b border-[rgb(var(--border))] flex items-center justify-between px-4">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center shadow-sm">
          <ApexIcon size={16} />
        </div>
        <span className="font-bold text-base tracking-tight text-[rgb(var(--foreground))]">Apex</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[rgb(var(--muted-foreground))] hidden xs:block">
          {getGreeting()}, {userName ?? 'there'} 👋
        </span>
        <ThemeToggle />
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title="Sign out"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
        >
          <LogOut size={14} />
        </button>
      </div>
    </header>
  )
}
