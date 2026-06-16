'use client'
import { useState } from 'react'
import { Sparkles, Loader2, RefreshCw, AlertCircle, Target, Flame, Clock, ChevronRight } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Profile } from '@/types'

interface Props {
  profile: Profile
  bmi: number | null
  bmr: number | null
  avgDailyCalories: number | null
}

interface ProfileAdvice {
  calorie_target: number
  calorie_deficit: number
  tdee: number
  weekly_loss_kg: number
  weeks_to_goal: number
  macro_targets: { protein_g: number; carbs_g: number; fat_g: number }
  summary: string
  tips: string[]
}

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const statusColor = (s: string) =>
  s === 'low'      ? 'text-red-500'
  : s === 'high'   ? 'text-amber-500'
  : 'text-emerald-500'

export default function AIProfileAdvisor({ profile, bmi, bmr, avgDailyCalories }: Props) {
  const [advice, setAdvice]   = useState<ProfileAdvice | null>(null)
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
          type: 'profile',
          profile,
          bmi,
          bmr,
          avgDailyCalories,
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

  const MacroBar = ({ label, g, total, color }: { label: string; g: number; total: number; color: string }) => (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-[rgb(var(--foreground))]">{label}</span>
        <span className="font-semibold text-[rgb(var(--foreground))]">{g}g</span>
      </div>
      <div className="h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, (g / total) * 100)}%` }} />
      </div>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header button */}
      {!advice && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Sparkles size={22} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-[rgb(var(--foreground))]">AI Calorie & Macro Advisor</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">
              Analyses your profile to suggest a personalised calorie target and macro split
            </p>
          </div>
          <Button onClick={analyze} loading={loading} className="gap-2 px-6">
            <Sparkles size={15} /> Analyse My Profile
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
          {/* Calorie summary */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Target,  label: 'Daily target',   value: advice.calorie_target.toLocaleString(), unit: 'kcal', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
              { icon: Flame,   label: 'Daily deficit',  value: advice.calorie_deficit.toLocaleString(), unit: 'kcal', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-500' },
              { icon: Clock,   label: 'Weeks to goal',  value: String(advice.weeks_to_goal), unit: 'wks',  color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-500' },
            ].map(({ icon: Icon, label, value, unit, color }) => (
              <div key={label} className="bg-[rgb(var(--muted))] rounded-2xl p-3 text-center">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${color}`}>
                  <Icon size={15} />
                </div>
                <p className="text-base font-bold text-[rgb(var(--foreground))] leading-none">{value}</p>
                <p className="text-[10px] text-[rgb(var(--muted-foreground))] mt-0.5">{unit}</p>
                <p className="text-[10px] font-medium text-[rgb(var(--foreground))] mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* TDEE + expected loss */}
          <div className="flex items-center justify-between px-3 py-2 bg-[rgb(var(--muted))] rounded-xl text-xs">
            <span className="text-[rgb(var(--muted-foreground))]">Your TDEE</span>
            <span className="font-semibold text-[rgb(var(--foreground))]">{advice.tdee.toLocaleString()} kcal</span>
            <span className="text-[rgb(var(--muted-foreground))]">·</span>
            <span className="text-[rgb(var(--muted-foreground))]">Expected loss</span>
            <span className="font-semibold text-emerald-500">{advice.weekly_loss_kg} kg/week</span>
          </div>

          {/* Macros */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide mb-2">Macro targets</p>
            <div className="space-y-2.5">
              <MacroBar label={`Protein — ${advice.macro_targets.protein_g}g`} g={advice.macro_targets.protein_g} total={advice.macro_targets.protein_g + advice.macro_targets.carbs_g + advice.macro_targets.fat_g} color="bg-blue-500" />
              <MacroBar label={`Carbs — ${advice.macro_targets.carbs_g}g`}   g={advice.macro_targets.carbs_g}   total={advice.macro_targets.protein_g + advice.macro_targets.carbs_g + advice.macro_targets.fat_g} color="bg-yellow-400" />
              <MacroBar label={`Fat — ${advice.macro_targets.fat_g}g`}       g={advice.macro_targets.fat_g}     total={advice.macro_targets.protein_g + advice.macro_targets.carbs_g + advice.macro_targets.fat_g} color="bg-red-400" />
            </div>
          </div>

          {/* Summary */}
          <p className="text-sm text-[rgb(var(--foreground))] leading-relaxed border-l-2 border-emerald-500 pl-3">{advice.summary}</p>

          {/* Tips */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide mb-2">Personalised tips</p>
            <ul className="space-y-2">
              {advice.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--foreground))]">
                  <ChevronRight size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Regenerate */}
          <button onClick={analyze} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))] hover:text-emerald-500 transition-colors">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analysing…' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  )
}
