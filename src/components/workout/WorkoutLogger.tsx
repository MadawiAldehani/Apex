'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Plus, Trash2, Star } from 'lucide-react'
import { todayISO } from '@/lib/utils'

interface ExerciseRow { name: string; sets: string; reps: string; weight_kg: string; is_pr: boolean }

const activityOptions = [
  { value: 'gym', label: 'Gym' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'walking', label: 'Walking' },
  { value: 'lagree', label: 'Lagree' },
  { value: 'other', label: 'Other' },
]
const moodOptions = [
  { value: '1', label: '😞 Terrible' },
  { value: '2', label: '😐 Bad' },
  { value: '3', label: '🙂 Okay' },
  { value: '4', label: '😊 Good' },
  { value: '5', label: '🔥 Amazing' },
]

const emptyExercise = (): ExerciseRow => ({ name: '', sets: '', reps: '', weight_kg: '', is_pr: false })

export default function WorkoutLogger({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState({
    date: todayISO(),
    activity_type: 'gym',
    duration_mins: '',
    calories_burned: '',
    mood: '',
    energy_level: '',
    notes: '',
  })
  const [exercises, setExercises] = useState<ExerciseRow[]>([emptyExercise()])

  const setField = (k: string, v: string) => setSession(s => ({ ...s, [k]: v }))

  const addExercise = () => setExercises(e => [...e, emptyExercise()])
  const removeExercise = (i: number) => setExercises(e => e.filter((_, idx) => idx !== i))
  const updateExercise = (i: number, k: keyof ExerciseRow, v: string | boolean) =>
    setExercises(e => e.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const { data: sessionData, error } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        date: session.date,
        activity_type: session.activity_type,
        duration_mins: session.duration_mins ? parseInt(session.duration_mins) : null,
        calories_burned: session.calories_burned ? parseInt(session.calories_burned) : null,
        mood: session.mood ? parseInt(session.mood) : null,
        energy_level: session.energy_level ? parseInt(session.energy_level) : null,
        notes: session.notes || null,
      })
      .select()
      .single()

    if (error) { setLoading(false); return }

    const validExercises = exercises.filter(ex => ex.name.trim())
    if (validExercises.length > 0) {
      await supabase.from('exercises').insert(
        validExercises.map(ex => ({
          session_id: sessionData.id,
          user_id: userId,
          name: ex.name,
          sets: ex.sets ? parseInt(ex.sets) : null,
          reps: ex.reps ? parseInt(ex.reps) : null,
          weight_kg: ex.weight_kg ? parseFloat(ex.weight_kg) : null,
          is_pr: ex.is_pr,
        }))
      )
    }

    setLoading(false)
    router.refresh()
    setSession({ date: todayISO(), activity_type: 'gym', duration_mins: '', calories_burned: '', mood: '', energy_level: '', notes: '' })
    setExercises([emptyExercise()])
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Session details */}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={session.date} onChange={e => setField('date', e.target.value)} />
        <Select label="Activity" options={activityOptions} value={session.activity_type} onChange={e => setField('activity_type', e.target.value)} />
        <Input label="Duration (mins)" type="number" placeholder="60" value={session.duration_mins} onChange={e => setField('duration_mins', e.target.value)} />
        <Input label="Calories burned" type="number" placeholder="400" value={session.calories_burned} onChange={e => setField('calories_burned', e.target.value)} />
        <Select label="Mood" placeholder="How do you feel?" options={moodOptions} value={session.mood} onChange={e => setField('mood', e.target.value)} />
        <Select label="Energy level" placeholder="Energy level?" options={moodOptions} value={session.energy_level} onChange={e => setField('energy_level', e.target.value)} />
      </div>
      <Input label="Notes (optional)" placeholder="Great session..." value={session.notes} onChange={e => setField('notes', e.target.value)} />

      {/* Exercises */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[rgb(var(--foreground))]">Exercises</h3>
          <Button type="button" variant="outline" size="sm" onClick={addExercise}>
            <Plus size={14} /> Add exercise
          </Button>
        </div>
        <div className="space-y-3">
          {exercises.map((ex, i) => (
            <Card key={i}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Exercise name (e.g. Bench Press)"
                    value={ex.name}
                    onChange={e => updateExercise(i, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => updateExercise(i, 'is_pr', !ex.is_pr)}
                    className={`p-2 rounded-lg transition-colors ${ex.is_pr ? 'bg-yellow-100 text-yellow-600' : 'text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))]'}`}
                    title="Personal Record"
                  >
                    <Star size={16} fill={ex.is_pr ? 'currentColor' : 'none'} />
                  </button>
                  {exercises.length > 1 && (
                    <button type="button" onClick={() => removeExercise(i)} className="p-2 rounded-lg text-[rgb(var(--muted-foreground))] hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Sets" type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} />
                  <Input placeholder="Reps" type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} />
                  <Input placeholder="Weight (kg)" type="number" value={ex.weight_kg} onChange={e => updateExercise(i, 'weight_kg', e.target.value)} />
                </div>
                {ex.is_pr && (
                  <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-medium">
                    <Star size={12} fill="currentColor" /> New personal record!
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Save workout
      </Button>
    </form>
  )
}
