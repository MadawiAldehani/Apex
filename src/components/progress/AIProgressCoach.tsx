'use client'
import { useState } from 'react'
import { Sparkles, RefreshCw, AlertCircle, Star, TrendingUp, TrendingDown, ChevronRight, Trophy, Zap } from 'lucide-react'
import Button from '@/components/ui/Button'
import { Profile } from '@/types'

interface Props {
  profile: Profile
  bmi: number | null
  currentWeight: number | null
  targetWeight: number | null
  weightChange: number | null
  workoutCount: number
  avgDuration: number
  totalCalsBurned: number
  activitiesUsed: string[]
  avgDailyCalories: number | null
  avgProtein: number | null
  avgCarbs: number | null
  avgFat: number | null
  avgMood: number | null
}

interface ProgressAdvice {
  overall_score: number
  assessment: string
  strengths: string[]
  improvements: string[]
  recommendations: { category: string; action: string }[]
  next_30_days: string
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const scoreColor = (s: number) =>
  s >= 8 ? 'text-emerald-500'
  : s >= 6 ? 'text-blue-500'
  : s >= 4 ? 'text-amber-500'
  : 'text-red-500'

const scoreBg = (s: number) =>
  s >= 8 ? 'bg-emerald-500'
  : s >= 6 ? 'bg-blue-500'
  : s >= 4 ? 'bg-amber-500'
  : 'bg-red-500'

const categoryIcon: Record<string, React.ReactNode> = {
  Nutrition: <span className="text-base">🥗</span>,
  Training:  <span className="text-base">💪</span>,
  Recovery:  <span className="text-base">😴</span>,
  Mindset:   <span className="text-base">🧠</span>,
}

export default function AIProgressCoach({
  profile, bmi, currentWeight, targetWeight, weightChange, workoutCount,
  avgDuration, totalCalsBurned, activitiesUsed, avgDailyCalories,
  avgProtein, avgCarbs, avgFat, avgMood,
}: Props) {
  const [advice, setAdvice]   = useState<ProgressAdvice | null>(null)
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
          type: 'progress',
          profile,
          bmi,
          currentWeight,
          targetWeight,
          weightChange,
          workoutCount,
          avgDuration,
          totalCalsBurned,
          activitiesUsed,
          avgDailyCalories,
          avgProtein,
          avgCarbs,
          avgFat,
          avgMood,
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
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
            <TrendingUp size={22} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-[rgb(var(--foreground))]">AI Progress Evaluation</p>
            <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">
              Deep analysis of your workouts, diet, and body data — scored out of 10
            </p>
          </div>
          <Button onClick={analyze} loading={loading} variant="secondary" className="gap-2 px-6">
            <Sparkles size={15} /> Evaluate My Progress
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
          {/* Score */}
          <div className="flex items-center gap-4 p-4 bg-[rgb(var(--muted))] rounded-2xl">
            <div className="relative w-16 h-16 shrink-0">
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="6" className="text-[rgb(var(--border))]" />
                <circle cx="32" cy="32" r="28" fill="none" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - advice.overall_score / 10)}`}
                  className={`${scoreBg(advice.overall_score)} transition-all duration-700`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-xl font-bold ${scoreColor(advice.overall_score)}`}>{advice.overall_score}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted-foreground))] font-medium uppercase tracking-wide">Progress score</p>
              <p className={`text-2xl font-bold ${scoreColor(advice.overall_score)}`}>
                {advice.overall_score >= 8 ? 'Excellent' : advice.overall_score >= 6 ? 'Good' : advice.overall_score >= 4 ? 'Fair' : 'Needs work'}
              </p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-0.5">out of 10</p>
            </div>
          </div>

          {/* Assessment */}
          <p className="text-sm text-[rgb(var(--foreground))] leading-relaxed border-l-2 border-blue-500 pl-3">{advice.assessment}</p>

          {/* Strengths + improvements */}
          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Trophy size={11} /> Strengths
              </p>
              <ul className="space-y-1.5">
                {advice.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--foreground))]">
                    <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Zap size={11} /> Areas to improve
              </p>
              <ul className="space-y-1.5">
                {advice.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[rgb(var(--foreground))]">
                    <span className="text-amber-500 mt-0.5 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div>
            <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide mb-2">Action plan</p>
            <div className="space-y-2">
              {advice.recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[rgb(var(--muted))] rounded-xl">
                  <div className="shrink-0 mt-0.5">{categoryIcon[r.category] ?? <ChevronRight size={14} className="text-blue-500" />}</div>
                  <div>
                    <p className="text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide">{r.category}</p>
                    <p className="text-sm text-[rgb(var(--foreground))]">{r.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next 30 days */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Next 30 days — focus on</p>
            <p className="text-sm text-[rgb(var(--foreground))] leading-relaxed">{advice.next_30_days}</p>
          </div>

          {/* Regenerate */}
          <button onClick={analyze} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-[rgb(var(--muted-foreground))] hover:text-blue-500 transition-colors">
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Analysing…' : 'Regenerate'}
          </button>
        </div>
      )}
    </div>
  )
}
