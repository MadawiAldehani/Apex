import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import WorkoutLogger from '@/components/workout/WorkoutLogger'
import AIWorkoutCoach from '@/components/workout/AIWorkoutCoach'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { activityLabel, formatDate } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import { Star, Clock, Flame } from 'lucide-react'

export default async function WorkoutPage() {
  const user = await getServerUser()
  const supabase = await createClient()
  const userId = user.id

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [sessionsRes, profileRes, recentWorkoutsRes, mealsRes] = await Promise.all([
    supabase.from('workout_sessions').select('*, exercises(*)').eq('user_id', userId).order('date', { ascending: false }).limit(10),
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('workout_sessions').select('date, activity_type, duration_mins').eq('user_id', userId).gte('date', thirtyDaysAgo),
    supabase.from('meals').select('calories, protein_g, carbs_g, fat_g').eq('user_id', userId).gte('date', thirtyDaysAgo),
  ])

  const sessions = sessionsRes.data ?? []
  const profile = profileRes.data ?? null
  const recentWorkouts = recentWorkoutsRes.data ?? []
  const meals = mealsRes.data ?? []

  // Workout stats
  const workoutFrequency = recentWorkouts.length > 0
    ? Math.round((recentWorkouts.length / 4.3) * 10) / 10  // per week avg over 30 days
    : 0

  const avgDuration = recentWorkouts.length > 0
    ? Math.round(recentWorkouts.reduce((s, w) => s + (w.duration_mins ?? 0), 0) / recentWorkouts.filter(w => w.duration_mins).length) || 0
    : 0

  const recentActivities = [...new Set(recentWorkouts.map(w => w.activity_type).filter(Boolean))] as string[]

  // Diet stats (30 days)
  const avgDailyCalories = meals.length > 0
    ? Math.round(meals.reduce((s, m) => s + (m.calories ?? 0), 0) / 30)
    : null
  const avgProtein = meals.length > 0
    ? Math.round(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0) / 30)
    : null
  const avgCarbs = meals.length > 0
    ? Math.round(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0) / 30)
    : null
  const avgFat = meals.length > 0
    ? Math.round(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0) / 30)
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Workout</h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">Log your sessions and track exercises</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Logger */}
        <div className="xl:col-span-3">
          <Card>
            <CardHeader><CardTitle>Log a workout</CardTitle></CardHeader>
            <CardContent>
              <WorkoutLogger userId={userId} />
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader><CardTitle>Recent sessions</CardTitle></CardHeader>
            <CardContent>
              {(!sessions || sessions.length === 0) ? (
                <p className="text-sm text-[rgb(var(--muted-foreground))] text-center py-8">No workouts yet</p>
              ) : (
                <div className="space-y-4">
                  {sessions.map((s) => (
                    <div key={s.id} className="border border-[rgb(var(--border))] rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="success">{activityLabel(s.activity_type ?? '')}</Badge>
                            {s.mood === 5 && <span className="text-xs">🔥</span>}
                          </div>
                          <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{formatDate(s.date)}</p>
                        </div>
                        <div className="text-right space-y-1">
                          {s.duration_mins && (
                            <div className="flex items-center gap-1 text-xs text-[rgb(var(--muted-foreground))]">
                              <Clock size={11} /> {s.duration_mins}m
                            </div>
                          )}
                          {s.calories_burned && (
                            <div className="flex items-center gap-1 text-xs text-orange-500">
                              <Flame size={11} /> {s.calories_burned}
                            </div>
                          )}
                        </div>
                      </div>
                      {s.exercises && s.exercises.length > 0 && (
                        <div className="space-y-1">
                          {s.exercises.map((ex: { id: string; name: string; sets?: number; reps?: number; weight_kg?: number; is_pr?: boolean }) => (
                            <div key={ex.id} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-1 text-[rgb(var(--foreground))]">
                                {ex.is_pr && <Star size={10} className="text-yellow-500" fill="currentColor" />}
                                {ex.name}
                              </span>
                              <span className="text-[rgb(var(--muted-foreground))]">
                                {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ''}
                                {ex.weight_kg ? ` @ ${ex.weight_kg}kg` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {s.notes && (
                        <p className="text-xs text-[rgb(var(--muted-foreground))] italic border-t border-[rgb(var(--border))] pt-2">{s.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Workout & Nutrition Coach */}
      <Card>
        <CardHeader><CardTitle>AI Coach</CardTitle></CardHeader>
        <CardContent>
          <AIWorkoutCoach
            profile={profile}
            workoutFrequency={workoutFrequency}
            avgDuration={avgDuration}
            recentActivities={recentActivities}
            avgDailyCalories={avgDailyCalories}
            avgProtein={avgProtein}
            avgCarbs={avgCarbs}
            avgFat={avgFat}
            calorieTarget={null}
            macroTargets={null}
          />
        </CardContent>
      </Card>
    </div>
  )
}
