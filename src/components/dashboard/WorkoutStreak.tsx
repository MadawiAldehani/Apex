'use client'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakProps {
  streak: number
  last30Days: string[]
}

export default function WorkoutStreak({ streak, last30Days }: StreakProps) {
  const today = new Date()
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today)
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Activity Streak</CardTitle>
          <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
            <Flame size={14} className="text-orange-500" />
            <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak} days</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-10 gap-1.5 mt-2">
          {days.map((day) => {
            const active = last30Days.includes(day)
            return (
              <div
                key={day}
                title={day}
                className={cn(
                  'w-full aspect-square rounded-md transition-colors',
                  active ? 'bg-emerald-500' : 'bg-[rgb(var(--muted))]'
                )}
              />
            )
          })}
        </div>
        <p className="text-xs text-[rgb(var(--muted-foreground))] mt-3">Last 30 days — green = active</p>
      </CardContent>
    </Card>
  )
}
