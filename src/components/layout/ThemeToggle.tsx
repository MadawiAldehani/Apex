'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { cn } from '@/lib/utils'

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      className={cn(
        'relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        theme === 'dark' ? 'bg-emerald-500' : 'bg-gray-200',
        className
      )}
      aria-label="Toggle theme"
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center transition-transform',
          theme === 'dark' && 'translate-x-6'
        )}
      >
        {theme === 'dark' ? (
          <Moon size={12} className="text-emerald-600" />
        ) : (
          <Sun size={12} className="text-yellow-500" />
        )}
      </span>
    </button>
  )
}
