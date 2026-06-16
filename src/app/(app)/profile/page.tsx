import { createClient } from '@/lib/supabase/server'
import { USER_ID } from '@/lib/user'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import ProfileEditor from '@/components/profile/ProfileEditor'
import GoalsManager from '@/components/profile/GoalsManager'
import AIProfileAdvisor from '@/components/profile/AIProfileAdvisor'
import { calculateBMI, calculateBMR, getBMICategory, goalLabel, activityLabel } from '@/lib/utils'

export default async function ProfilePage() {
  const supabase = await createClient()
  const userId = USER_ID

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const [profileRes, goalsRes, mealsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('meals').select('calories').eq('user_id', userId).gte('date', thirtyDaysAgo),
  ])

  const profile = profileRes.data
  const goals = goalsRes.data ?? []
  const recentMeals = mealsRes.data ?? []

  const bmi = profile?.weight && profile?.height ? calculateBMI(profile.weight, profile.height) : null
  const bmiCat = bmi ? getBMICategory(bmi) : null
  const bmr = profile?.weight && profile?.height && profile?.age
    ? calculateBMR(profile.weight, profile.height, profile.age, profile.gender ?? 'female')
    : null

  // Average daily calories over the last 30 days
  const totalCalorieEntries = recentMeals.reduce((s, m) => s + (m.calories ?? 0), 0)
  const avgDailyCalories = recentMeals.length > 0 ? Math.round(totalCalorieEntries / 30) : null

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">Profile</h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">Manage your info and goals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats sidebar */}
        <div className="space-y-6">
          {/* Avatar / Identity card */}
          <Card>
            <CardContent className="py-6 flex flex-col items-center text-center gap-3">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile photo"
                  className="w-20 h-20 rounded-2xl object-cover shadow-sm border-2 border-emerald-400"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.removeAttribute('style')
                  }}
                />
              ) : null}
              <div
                className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-sm"
                style={profile?.avatar_url ? { display: 'none' } : undefined}
              >
                {profile?.name?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <div>
                <h2 className="text-lg font-bold text-[rgb(var(--foreground))]">{profile?.name ?? 'User'}</h2>
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Local account</p>
              </div>
              {profile?.goal && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
                  {goalLabel(profile.goal)}
                </span>
              )}
            </CardContent>
          </Card>

          {/* Computed stats */}
          <Card>
            <CardHeader><CardTitle>Health metrics</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {bmi ? (
                <div className="p-4 rounded-xl border border-[rgb(var(--border))]">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">BMI</p>
                      <p className={`text-2xl font-bold ${bmiCat?.color}`}>{bmi}</p>
                      <p className={`text-xs font-medium ${bmiCat?.color}`}>{bmiCat?.label}</p>
                    </div>
                    <div className="text-right text-xs text-[rgb(var(--muted-foreground))]">
                      <p>Under 18.5 → Underweight</p>
                      <p>18.5–24.9 → Normal</p>
                      <p>25–29.9 → Overweight</p>
                      <p>30+ → Obese</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[rgb(var(--muted-foreground))]">Add weight & height to see BMI</p>
              )}
              {bmr && (
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">BMR (calories/day)</span>
                  <span className="font-medium text-[rgb(var(--foreground))]">{bmr} kcal</span>
                </div>
              )}
              {profile?.weight && (
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">Current weight</span>
                  <span className="font-medium">{profile.weight} {profile.units === 'metric' ? 'kg' : 'lbs'}</span>
                </div>
              )}
              {profile?.target_weight && (
                <div className="flex justify-between text-sm">
                  <span className="text-[rgb(var(--muted-foreground))]">Target weight</span>
                  <span className="font-medium text-emerald-500">{profile.target_weight} {profile.units === 'metric' ? 'kg' : 'lbs'}</span>
                </div>
              )}
              {profile?.weight && profile?.target_weight && (
                <div>
                  <div className="flex justify-between text-xs text-[rgb(var(--muted-foreground))] mb-1">
                    <span>Progress to goal</span>
                    <span>{Math.abs(Math.round(profile.weight - profile.target_weight) * 10) / 10} kg to go</span>
                  </div>
                  <div className="h-2 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, 100 - Math.abs((profile.weight - profile.target_weight) / profile.weight) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main editing area */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Edit profile</CardTitle></CardHeader>
            <CardContent>
              <ProfileEditor userId={userId} profile={profile} />
            </CardContent>
          </Card>

          {/* AI Calorie & Macro Advisor */}
          {profile && (
            <Card>
              <CardHeader><CardTitle>AI Coach</CardTitle></CardHeader>
              <CardContent>
                <AIProfileAdvisor
                  profile={profile}
                  bmi={bmi}
                  bmr={bmr}
                  avgDailyCalories={avgDailyCalories}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Goals</CardTitle></CardHeader>
            <CardContent>
              <GoalsManager userId={userId} goals={goals} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
