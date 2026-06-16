'use client'
import { useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle, Dumbbell, UtensilsCrossed, Calendar, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Profile } from '@/types'

interface Props {
  profile: Profile | null
  workoutFrequency: number
  avgDuration: number
  recentActivities: string[]
  avgDailyCalories: number | null
  avgProtein: number | null
  avgCarbs: number | null
  avgFat: number | null
  calorieTarget: number | null
  macroTargets: { protein_g: number; carbs_g: number; fat_g: number } | null
}

interface WorkoutAdvice {
  workout_tips: string[]
  nutrition_tips: string[]
  macro_analysis: {
    protein_status: 'low' | 'on_track' | 'high'
    carbs_status: 'low' | 'on_track' | 'high'
    fat_status: 'low' | 'on_track' | 'high'
    priority: 'protein' | 'carbs' | 'fat'
    key_insight: string
  }
  weekly_plan: {
    recommended_sessions: number
    session_length_mins: number
    activity_mix: string
  }
  summary: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const statusPill = (s: 'low' | 'on_track' | 'high') =>
  s === 'low'      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  : s === 'high'   ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'

const statusLabel = (s: 'low' | 'on_track' | 'high') =>
  s === 'low' ? 'Too low' : s === 'high' ? 'Too high' : 'On track'

export default function AIWorkoutCoach({
  profile, workoutFrequency, avgDuration, recentActivities,
  avgDailyCalories, avgProtein, avgCarbs, avgFat,
  calorieTarget, macroTargets,
}: Props) {
  const [advice, setAdvice]   = useState<WorkoutAdvice | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [uncfg, setUncfg]     = useState(false)

  const analyze = async () => {
    setLoading(true)
    setError(null)
    setUncfg(false)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-coach`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          type: 'workout',
          profile,
          workoutFrequency,
          avgDuration,
          recentActivities,
          avgDailyCalories,
          avgProtein,
          avgCarbs,
          avgFat,
          calorieTarget,
          macroTargets,
        }),
      })
      if (res.status === 503) { setUncfg(true); return }
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setAdvice(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Initial CTA */}
      {!advice && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Dumbbell size={22} className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-[rgb(var(--foreground))]">AI Workout & Nutrition Coach</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">
              Combines your workout history and diet data to give targeted coaching
            </p>
          </div>
          <Button onClick={analyze} loading={loading} variant="secondary" className="gap-2 px-6">
            <Sparkles size={15} /> Get My Coaching Plan
          </Button>
        </div>
      )}

      {/* Unconfigured */}
      {uncfg && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>Add <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">OPENROUTER_API_KEY</code> to your Supabase Edge Function secrets to activate AI coaching.</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}

      {/* Results */}
      {advice && (
        <div className="space-y-4">
          {/* Weekly plan summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Sessions/week', value: String(advice.weekly_plan.recommended_sessions), icon: Calendar, color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
              { label: 'Session length', value: `${advice.weekly_plan.session_length_mins}m`, icon: Dumbbell, color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' },
              { label: 'Current freq.', value: `${workoutFrequency}x`, icon: Calendar, color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-[rgb(var(--muted))] rounded-2xl p-3 text-center">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                  <Icon size={15} />
                </div>
                <p className="text-base font-bold text-[rgb(var(--foreground))] leading-none">{value}</p>
                <p className="text-[10px] font-medium text-[rgb(var(--muted-foreground))] mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Activity mix recommendation */}
          <div className="flex items-start gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <Dumbbell size={14} className="text-purple-500 mt-0.5 shrink-0" />
            <p className="text-sm text-[rgb(var(--foreground))]">{advice.weekly_plan.activity_mix}</p>
          </div>

          {/* Macro analysis */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide mb-2 flex items-center gap-1">
              <UtensilsCrossed size={11} /> Macro status
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { label: 'Protein', status: advice.macro_analysis.protein_status },
                { label: 'Carbs',   status: advice.macro_analysis.carbs_status },
                { label: 'Fat',     status: advice.macro_analysis.fat_status },
              ].map(({ label, status }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-[rgb(var(--muted-foreground))] mb-1">{label}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusPill(status)}`}>
                    {statusLabel(status)}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-[rgb(var(--foreground))] border-l-2 border-purple-500 pl-3">{advice.macro_analysis.key_insight}</p>
          </div>

          {/* Workout tips */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Dumbbell size={11} /> Workout tips
            </p>
            <ul className="space-y-2">
              {advice.workout_tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--foreground))]">
                  <ChevronRight size={14} className="text-purple-500 mt-0.5 shrink-0" />{t}
                </li>
              ))}
            </ul>
          </div>

          {/* Nutrition tips */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <UtensilsCrossed size={11} /> Nutrition tips
            </p>
            <ul className="space-y-2">
              {advice.nutrition_tips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--foreground))]">
                  <ChevronRight size={14} className="text-emerald-500 mt-0.5 shrink-0" />{t}
                </li>
              ))}
            </ul>
          </div>

          {/* Summary */}
          <p className="text-sm text-[rgb(var(--foreground))] leading-relaxed bg-[rgb(var(--muted))] p-3 rounded-xl">{advice.summary}</p>

          {/* Regenerate */}
          <button onClick={analyze} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))] hover:text-purple-500 transition-colors">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analysing…' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  )
}
