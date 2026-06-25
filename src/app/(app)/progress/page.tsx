import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import WeightChart from '@/components/dashboard/WeightChart'
import CalorieChart from '@/components/dashboard/CalorieChart'
import MeasurementLogger from '@/components/progress/MeasurementLogger'
import MoodLogger from '@/components/progress/MoodLogger'
import AIProgressCoach from '@/components/progress/AIProgressCoach'
import { formatDate, calculateBMI, getBMICategory } from '@/lib/utils'
import { ImageIcon, FileText } from 'lucide-react'
import { mediaSrc } from '@/lib/media'

export default async function ProgressPage() {
  const user = await getServerUser()
  const supabase = await createClient()
  const userId = user.id

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]

  const [measurementsRes, workoutsRes, moodRes, dietRes] = await Promise.all([
    supabase.from('body_measurements').select('*').eq('user_id', userId).gte('date', ninetyDaysAgo).order('date'),
    supabase.from('workout_sessions').select('date, activity_type, duration_mins, calories_burned, mood, energy_level').eq('user_id', userId).gte('date', ninetyDaysAgo).order('date'),
    supabase.from('mood_logs').select('*').eq('user_id', userId).gte('date', ninetyDaysAgo).order('date', { ascending: false }),
    supabase.from('meals').select('calories, protein_g, carbs_g, fat_g').eq('user_id', userId).gte('date', ninetyDaysAgo),
  ])

  const measurements = measurementsRes.data ?? []
  const workouts = workoutsRes.data ?? []
  const moodLogs = moodRes.data ?? []
  const dietData = dietRes.data ?? []

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

  const weightChartData = measurements.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight,
  }))

  const latestMeasurement = measurements[measurements.length - 1]
  const firstMeasurement = measurements[0]
  const totalWeightChange = latestMeasurement && firstMeasurement && latestMeasurement !== firstMeasurement
    ? Math.round((latestMeasurement.weight - firstMeasurement.weight) * 10) / 10
    : 0

  const avgDuration = workouts.length > 0
    ? Math.round(workouts.reduce((s, w) => s + (w.duration_mins ?? 0), 0) / workouts.filter(w => w.duration_mins).length) || 0
    : 0

  const totalCalsBurned = workouts.reduce((s, w) => s + (w.calories_burned ?? 0), 0)

  const avgMood = moodLogs.length > 0
    ? Math.round((moodLogs.reduce((s, m) => s + (m.mood ?? 0), 0) / moodLogs.length) * 10) / 10
    : null

  // Diet averages (90 days)
  const avgDailyCalories = dietData.length > 0
    ? Math.round(dietData.reduce((s, m) => s + (m.calories ?? 0), 0) / 90)
    : null
  const avgProtein = dietData.length > 0
    ? Math.round(dietData.reduce((s, m) => s + (m.protein_g ?? 0), 0) / 90)
    : null
  const avgCarbs = dietData.length > 0
    ? Math.round(dietData.reduce((s, m) => s + (m.carbs_g ?? 0), 0) / 90)
    : null
  const avgFat = dietData.length > 0
    ? Math.round(dietData.reduce((s, m) => s + (m.fat_g ?? 0), 0) / 90)
    : null

  // Distinct activities logged in 90 days
  const activitiesUsed = [...new Set(workouts.map(w => w.activity_type).filter(Boolean))] as string[]

  const bmi = latestMeasurement?.weight && (latestMeasurement?.height || profile?.height)
    ? calculateBMI(latestMeasurement.weight, latestMeasurement.height ?? profile.height)
    : null
  const bmiCat = bmi ? getBMICategory(bmi) : null

  const moodEmoji = (v: number) => ['', '😞', '😐', '🙂', '😊', '🔥'][Math.round(v)] ?? '—'

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">Progress</h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">Track your body measurements and trends</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Weight change (90d)', value: totalWeightChange !== 0 ? `${totalWeightChange > 0 ? '+' : ''}${totalWeightChange} kg` : '—', color: totalWeightChange <= 0 ? 'text-emerald-500' : 'text-red-500' },
          { label: 'Current BMI', value: bmi ? `${bmi} — ${bmiCat?.label}` : '—', color: bmiCat?.color ?? 'text-[rgb(var(--foreground))]' },
          { label: 'Avg. session length', value: avgDuration ? `${avgDuration} min` : '—', color: 'text-blue-500' },
          { label: 'Avg. mood', value: avgMood ? `${moodEmoji(avgMood)} ${avgMood}` : '—', color: 'text-yellow-500' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-4">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-[rgb(var(--muted-foreground))] mt-1">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeightChart data={weightChartData} />
        <CalorieChart data={calorieChartData} />
      </div>

      {/* Progress photo gallery */}
      {measurements.some(m => m.photo_url) && (
        <Card>
          <CardHeader><CardTitle>Progress photos</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {[...measurements].reverse().filter(m => m.photo_url).map((m) => (
                <a
                  key={m.id}
                  href={mediaSrc(m.photo_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-xl overflow-hidden border border-[rgb(var(--border))] block"
                >
                  <img
                    src={mediaSrc(m.photo_url)}
                    alt={`Progress ${m.date}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[10px] font-medium">{formatDate(m.date)}</p>
                    {m.weight && <p className="text-white/80 text-[10px]">{m.weight} kg</p>}
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Log measurement */}
        <Card>
          <CardHeader><CardTitle>Log body measurement</CardTitle></CardHeader>
          <CardContent>
            <MeasurementLogger userId={userId} defaultHeight={profile?.height} />
          </CardContent>
        </Card>

        {/* Log mood */}
        <Card>
          <CardHeader><CardTitle>Log mood & energy</CardTitle></CardHeader>
          <CardContent>
            <MoodLogger userId={userId} />
          </CardContent>
        </Card>
      </div>

      {/* AI Progress Coach */}
      {profile && (
        <Card>
          <CardHeader><CardTitle>AI Coach</CardTitle></CardHeader>
          <CardContent>
            <AIProgressCoach
              profile={profile}
              bmi={bmi}
              currentWeight={latestMeasurement?.weight ?? null}
              targetWeight={profile.target_weight ?? null}
              weightChange={totalWeightChange}
              workoutCount={workouts.length}
              avgDuration={avgDuration}
              totalCalsBurned={totalCalsBurned}
              activitiesUsed={activitiesUsed}
              avgDailyCalories={avgDailyCalories}
              avgProtein={avgProtein}
              avgCarbs={avgCarbs}
              avgFat={avgFat}
              avgMood={avgMood}
            />
          </CardContent>
        </Card>
      )}

      {/* Measurement history */}
      {measurements.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Measurement history</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgb(var(--border))]">
                    {['Date', 'Weight', 'BMI', 'Waist', 'Hips', 'Arms', 'Chest', 'Files'].map(h => (
                      <th key={h} className="text-left py-2 pr-4 text-xs font-semibold text-[rgb(var(--muted-foreground))] uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().map((m) => (
                    <tr key={m.id} className="border-b border-[rgb(var(--border))] last:border-0">
                      <td className="py-2.5 pr-4 text-[rgb(var(--muted-foreground))]">{formatDate(m.date)}</td>
                      <td className="py-2.5 pr-4 font-medium">{m.weight ?? '—'} kg</td>
                      <td className={`py-2.5 pr-4 font-medium ${m.bmi ? getBMICategory(m.bmi).color : ''}`}>{m.bmi ?? '—'}</td>
                      <td className="py-2.5 pr-4">{m.waist ?? '—'}</td>
                      <td className="py-2.5 pr-4">{m.hips ?? '—'}</td>
                      <td className="py-2.5 pr-4">{m.arms ?? '—'}</td>
                      <td className="py-2.5 pr-4">{m.chest ?? '—'}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          {m.photo_url && (
                            <a href={mediaSrc(m.photo_url)} target="_blank" rel="noopener noreferrer" title="View progress photo">
                              <img
                                src={mediaSrc(m.photo_url)}
                                alt="Progress"
                                className="w-8 h-8 rounded-lg object-cover border border-[rgb(var(--border))] hover:scale-110 transition-transform"
                              />
                            </a>
                          )}
                          {m.report_url && (
                            <a
                              href={mediaSrc(m.report_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View InBody report"
                              className="w-8 h-8 rounded-lg border border-[rgb(var(--border))] flex items-center justify-center bg-red-50 dark:bg-red-900/20 hover:scale-110 transition-transform"
                            >
                              <FileText size={14} className="text-red-500" />
                            </a>
                          )}
                          {!m.photo_url && !m.report_url && <span className="text-[rgb(var(--muted-foreground))]">—</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
