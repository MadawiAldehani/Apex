'use client'
import { Card, CardContent } from '@/components/ui/Card'
import { Flame, Dumbbell, Droplets, TrendingDown } from 'lucide-react'

interface StatsProps {
  totalCaloriesToday: number
  workoutsThisWeek: number
  waterToday: number
  weightChange: number
}

export default function StatsCards({ totalCaloriesToday, workoutsThisWeek, waterToday, weightChange }: StatsProps) {
  const stats = [
    {
      label: 'Calories',
      value: totalCaloriesToday.toLocaleString(),
      unit: 'kcal today',
      icon: Flame,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    },
    {
      label: 'Workouts',
      value: workoutsThisWeek.toString(),
      unit: 'this week',
      icon: Dumbbell,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      label: 'Water',
      value: (waterToday / 1000).toFixed(1),
      unit: 'L today',
      icon: Droplets,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      label: 'Weight Δ',
      value: weightChange > 0 ? `+${weightChange}` : weightChange.toString(),
      unit: 'kg / month',
      icon: TrendingDown,
      color: weightChange <= 0
        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(({ label, value, unit, icon: Icon, color }) => (
        <Card key={label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-bold text-[rgb(var(--foreground))] leading-none">{value}</p>
              <p className="text-[10px] text-[rgb(var(--muted-foreground))] mt-0.5 truncate">{unit}</p>
              <p className="text-[10px] font-medium text-[rgb(var(--foreground))] mt-0.5">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
