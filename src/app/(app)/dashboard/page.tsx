import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import StatsCards from '@/components/dashboard/StatsCards'
import WeightChart from '@/components/dashboard/WeightChart'
import CalorieChart from '@/components/dashboard/CalorieChart'
import WorkoutStreak from '@/components/dashboard/WorkoutStreak'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { activityLabel, formatDate, calculateBMI, getBMICategory } from '@/lib/utils'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getServerUser()
  const supabase = await createClient()
  const userId = user.id

  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [profileRes, mealsRes, workoutsRes, waterRes, measurementsRes, goalsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('meals').select('*').eq('user_id', userId).eq('date', today),
    supabase.from('workout_sessions').select('date, activity_type, duration_mins').eq('user_id', userId).gte('date', monthAgo),
    supabase.from('water_logs').select('amount_ml').eq('user_id', userId).eq('date', today),
    supabase.from('body_measurements').select('date, weight').eq('user_id', userId).gte('date', monthAgo).order('date'),
    supabase.from('goals').select('*').eq('user_id', userId),
  ])

  const profile = profileRes.data
  const meals = mealsRes.data ?? []
  const workouts = workoutsRes.data ?? []
  const water = waterRes.data ?? []
  const measurements = measurementsRes.data ?? []
  const goals = goalsRes.data ?? []

  const caloriesToday = meals.reduce((s, m) => s + (m.calories ?? 0), 0)
  const workoutsThisWeek = workouts.filter(w => w.date >= weekAgo).length
  const waterToday = water.reduce((s, w) => s + w.amount_ml, 0)
  const weightChange = measurements.length >= 2
    ? Math.round((measurements[measurements.length - 1].weight - measurements[0].weight) * 10) / 10
    : 0

  const weightChartData = measurements.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight,
  }))

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const calorieChartData = await Promise.all(
    last7Days.map(async (date) => {
      const { data } = await supabase.from('meals').select('calories, protein_g, carbs_g, fat_g').eq('user_id', userId).eq('date', date)
      const ms = data ?? []
      return {
        day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        calories: ms.reduce((s, m) => s + (m.calories ?? 0), 0),
        protein: ms.reduce((s, m) => s + (m.protein_g ?? 0), 0),
        carbs: ms.reduce((s, m) => s + (m.carbs_g ?? 0), 0),
        fat: ms.reduce((s, m) => s + (m.fat_g ?? 0), 0),
      }
    })
  )

  const workoutDates = workouts.map(w => w.date)
  let streak = 0
  const checkDate = new Date()
  while (true) {
    const d = checkDate.toISOString().split('T')[0]
    if (!workoutDates.includes(d)) break
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  const recentWorkouts = workouts.slice(0, 5)

  const bmi = profile?.weight && profile?.height ? calculateBMI(profile.weight, profile.height) : null
  const bmiCat = bmi ? getBMICategory(bmi) : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">Dashboard</h1>
        <p className="text-[rgb(var(--muted-foreground))] text-xs mt-0.5">Here&apos;s your fitness overview</p>
      </div>

      <StatsCards
        totalCaloriesToday={caloriesToday}
        workoutsThisWeek={workoutsThisWeek}
        waterToday={waterToday}
        weightChange={weightChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeightChart data={weightChartData} />
        <CalorieChart data={calorieChartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WorkoutStreak streak={streak} last30Days={workoutDates} />
        </div>

        {/* Quick Stats */}
        <Card>
          <CardHeader><CardTitle>My Stats</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">Weight</span>
                  <span className="font-medium">{profile.weight ?? '—'} {profile.units === 'metric' ? 'kg' : 'lbs'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">Height</span>
                  <span className="font-medium">{profile.height ?? '—'} {profile.units === 'metric' ? 'cm' : 'in'}</span>
                </div>
                {bmi && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[rgb(var(--muted-foreground))]">BMI</span>
                    <span className={`font-medium ${bmiCat?.color}`}>{bmi} — {bmiCat?.label}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">Goal</span>
                  <span className="font-medium capitalize">{profile.goal?.replace('_', ' ') ?? '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">Activity</span>
                  <span className="font-medium">{profile.activity_type ? activityLabel(profile.activity_type) : '—'}</span>
                </div>
                {profile.target_weight && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[rgb(var(--muted-foreground))]">Target</span>
                    <span className="font-medium">{profile.target_weight} {profile.units === 'metric' ? 'kg' : 'lbs'}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-[rgb(var(--muted-foreground))] text-center py-4">
                <Link href="/profile" className="text-emerald-500 hover:underline">Complete your profile</Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Workouts</CardTitle>
            <Link href="/workout" className="text-xs text-emerald-500 hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentWorkouts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[rgb(var(--muted-foreground))] text-sm mb-3">No workouts logged yet</p>
              <Link href="/workout" className="text-emerald-500 text-sm font-medium hover:underline">Log your first workout →</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentWorkouts.map((w, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[rgb(var(--border))] last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 text-sm font-bold">
                      {activityLabel(w.activity_type ?? 'other')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[rgb(var(--foreground))]">{activityLabel(w.activity_type ?? 'other')}</p>
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">{formatDate(w.date)}</p>
                    </div>
                  </div>
                  {w.duration_mins && (
                    <span className="text-sm text-[rgb(var(--muted-foreground))]">{w.duration_mins} min</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goals */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Goals</CardTitle>
              <Link href="/profile" className="text-sm text-emerald-500 hover:underline">Manage</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.filter(g => !g.is_achieved).map((goal) => {
              const pct = Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100))
              return (
                <div key={goal.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-[rgb(var(--foreground))]">{goal.type.replace(/_/g, ' ')}</span>
                    <span className="text-[rgb(var(--muted-foreground))]">{pct}%</span>
                  </div>
                  <div className="h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
