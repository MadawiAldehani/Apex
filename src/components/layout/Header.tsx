'use client'
import { getGreeting } from '@/lib/utils'
import { Bell } from 'lucide-react'

interface HeaderProps {
  userName?: string
}

export default function Header({ userName }: HeaderProps) {
  return (
    <header className="h-16 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] flex items-center justify-between px-6">
      <div>
        <p className="text-sm text-[rgb(var(--muted-foreground))]">{getGreeting()},</p>
        <h2 className="font-semibold text-[rgb(var(--foreground))]">{userName ?? 'there'} 👋</h2>
      </div>
      <button className="relative w-9 h-9 rounded-xl hover:bg-[rgb(var(--muted))] flex items-center justify-center transition-colors">
        <Bell size={18} className="text-[rgb(var(--muted-foreground))]" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full" />
      </button>
    </header>
  )
}
