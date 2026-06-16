'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Droplets, Plus } from 'lucide-react'
import Button from '@/components/ui/Button'
import { todayISO } from '@/lib/utils'

const PRESETS = [150, 250, 330, 500]
const DAILY_GOAL = 2500

export default function WaterTracker({ userId, totalToday }: { userId: string; totalToday: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState<number | null>(null)

  const addWater = async (ml: number) => {
    setLoading(ml)
    const supabase = createClient()
    await supabase.from('water_logs').insert({
      user_id: userId,
      date: todayISO(),
      amount_ml: ml,
    })
    setLoading(null)
    router.refresh()
  }

  const pct = Math.min(100, Math.round((totalToday / DAILY_GOAL) * 100))
  const remaining = Math.max(0, DAILY_GOAL - totalToday)

  return (
    <div className="space-y-4">
      {/* Circular progress */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgb(var(--muted))" strokeWidth="10" />
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke="#10b981" strokeWidth="10"
              strokeDasharray={`${2 * Math.PI * 50}`}
              strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Droplets size={16} className="text-blue-500 mb-0.5" />
            <span className="text-xl font-bold text-[rgb(var(--foreground))]">
              {(totalToday / 1000).toFixed(1)}L
            </span>
            <span className="text-xs text-[rgb(var(--muted-foreground))]">{pct}%</span>
          </div>
        </div>
        <p className="text-sm text-[rgb(var(--muted-foreground))] mt-2">
          {remaining > 0 ? `${remaining}ml remaining` : '🎉 Daily goal reached!'}
        </p>
      </div>

      {/* Quick-add buttons */}
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((ml) => (
          <Button
            key={ml}
            type="button"
            variant="outline"
            size="sm"
            loading={loading === ml}
            onClick={() => addWater(ml)}
            className="flex-col h-auto py-2 gap-0.5"
          >
            <Plus size={12} />
            <span className="text-xs">{ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
