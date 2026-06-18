import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import MealLogger from '@/components/diet/MealLogger'
import WaterTracker from '@/components/diet/WaterTracker'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card'
import { Trash2 } from 'lucide-react'
import DeleteMealButton from '@/components/diet/DeleteMealButton'

export default async function DietPage() {
  const user = await getServerUser()
  const supabase = await createClient()
  const userId = user.id

  const today = new Date().toISOString().split('T')[0]

  const [mealsRes, waterRes, favoritesRes] = await Promise.all([
    supabase.from('meals').select('*').eq('user_id', userId).eq('date', today).order('created_at'),
    supabase.from('water_logs').select('amount_ml').eq('user_id', userId).eq('date', today),
    supabase.from('meals').select('name, meal_type, calories, protein_g, carbs_g, fat_g').eq('user_id', userId).eq('is_favorite', true).limit(10),
  ])

  const meals = mealsRes.data ?? []
  const waterTotal = (waterRes.data ?? []).reduce((s, w) => s + w.amount_ml, 0)
  const favorites = favoritesRes.data ?? []

  const totalCals = meals.reduce((s, m) => s + (m.calories ?? 0), 0)
  const totalProtein = meals.reduce((s, m) => s + (m.protein_g ?? 0), 0)
  const totalCarbs = meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0)
  const totalFat = meals.reduce((s, m) => s + (m.fat_g ?? 0), 0)

  const mealGroups = ['breakfast', 'lunch', 'dinner', 'snack'] as const
  const mealEmojis: Record<string, string> = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">Diet</h1>
        <p className="text-[rgb(var(--muted-foreground))] text-sm mt-1">Track your meals and hydration</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left: Logger + Water */}
        <div className="xl:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Add a meal</CardTitle></CardHeader>
            <CardContent>
              <MealLogger userId={userId} favorites={favorites} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Water intake</CardTitle></CardHeader>
            <CardContent>
              <WaterTracker userId={userId} totalToday={waterTotal} />
            </CardContent>
          </Card>
        </div>

        {/* Right: Today's meals + macro summary */}
        <div className="xl:col-span-3 space-y-6">
          {/* Macro summary */}
          <Card>
            <CardHeader><CardTitle>Today&apos;s nutrition</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 text-center">
                {[
                  { label: 'Calories', value: totalCals, unit: 'kcal', color: 'text-orange-500' },
                  { label: 'Protein', value: Math.round(totalProtein), unit: 'g', color: 'text-blue-500' },
                  { label: 'Carbs', value: Math.round(totalCarbs), unit: 'g', color: 'text-yellow-500' },
                  { label: 'Fat', value: Math.round(totalFat), unit: 'g', color: 'text-red-400' },
                ].map(({ label, value, unit, color }) => (
                  <div key={label} className="bg-[rgb(var(--muted))] rounded-xl p-3">
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                    <p className="text-xs text-[rgb(var(--muted-foreground))]">{unit}</p>
                    <p className="text-xs text-[rgb(var(--foreground))] font-medium mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Macro bar */}
              {totalCals > 0 && (
                <div className="mt-4">
                  <div className="h-3 rounded-full overflow-hidden flex gap-0.5">
                    <div className="bg-blue-500 rounded-l-full" style={{ width: `${Math.round((totalProtein * 4 / totalCals) * 100)}%` }} />
                    <div className="bg-yellow-400" style={{ width: `${Math.round((totalCarbs * 4 / totalCals) * 100)}%` }} />
                    <div className="bg-red-400 rounded-r-full flex-1" />
                  </div>
                  <div className="flex justify-between text-xs text-[rgb(var(--muted-foreground))] mt-1.5">
                    <span>Protein</span><span>Carbs</span><span>Fat</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meal groups */}
          <Card>
            <CardHeader><CardTitle>Today&apos;s meals</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {meals.length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted-foreground))] text-center py-6">No meals logged today</p>
              ) : (
                mealGroups.map((type) => {
                  const group = meals.filter(m => m.meal_type === type)
                  if (group.length === 0) return null
                  return (
                    <div key={type}>
                      <h3 className="text-sm font-semibold text-[rgb(var(--foreground))] mb-2 capitalize">
                        {mealEmojis[type]} {type}
                      </h3>
                      <div className="space-y-2">
                        {group.map((meal) => (
                          <div key={meal.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-[rgb(var(--muted))]">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {meal.image_url && (
                                <img
                                  src={meal.image_url}
                                  alt={meal.name}
                                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-[rgb(var(--border))]"
                                />
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-[rgb(var(--foreground))] truncate">{meal.name}</p>
                                <p className="text-xs text-[rgb(var(--muted-foreground))]">
                                  {meal.calories && `${meal.calories} kcal`}
                                  {meal.protein_g && ` · ${meal.protein_g}g protein`}
                                </p>
                              </div>
                            </div>
                            <DeleteMealButton mealId={meal.id} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
