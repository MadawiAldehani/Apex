'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Goal } from '@/types'
import { Plus, Trash2, CheckCircle2 } from 'lucide-react'

const goalTypeOptions = [
  { value: 'weight', label: 'Target weight (kg)' },
  { value: 'workouts_per_week', label: 'Workouts per week' },
  { value: 'calories_per_day', label: 'Daily calories' },
  { value: 'water_per_day', label: 'Water per day (ml)' },
  { value: 'steps', label: 'Daily steps' },
]

export default function GoalsManager({ userId, goals }: { userId: string; goals: Goal[] }) {
  const router = useRouter()
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ type: '', target_value: '', deadline: '' })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.type || !form.target_value) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('goals').insert({
      user_id: userId,
      type: form.type,
      target_value: parseFloat(form.target_value),
      deadline: form.deadline || null,
    })
    setLoading(false)
    setShowAdd(false)
    setForm({ type: '', target_value: '', deadline: '' })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    await supabase.from('goals').delete().eq('id', id)
    router.refresh()
  }

  const handleToggle = async (goal: Goal) => {
    const supabase = createClient()
    await supabase.from('goals').update({ is_achieved: !goal.is_achieved }).eq('id', goal.id)
    router.refresh()
  }

  const typeLabel = (type: string) => goalTypeOptions.find(o => o.value === type)?.label ?? type

  return (
    <div className="space-y-4">
      {goals.length === 0 && !showAdd && (
        <p className="text-sm text-[rgb(var(--muted-foreground))] text-center py-4">No goals yet — add your first!</p>
      )}

      {goals.length > 0 && (
        <div className="space-y-3">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round(((goal.current_value ?? 0) / goal.target_value) * 100))
            return (
              <div key={goal.id} className={`p-4 rounded-xl border ${goal.is_achieved ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10' : 'border-[rgb(var(--border))]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(goal)} className={goal.is_achieved ? 'text-emerald-500' : 'text-[rgb(var(--muted-foreground))]'}>
                      <CheckCircle2 size={18} fill={goal.is_achieved ? 'currentColor' : 'none'} />
                    </button>
                    <div>
                      <p className={`text-sm font-medium ${goal.is_achieved ? 'line-through text-[rgb(var(--muted-foreground))]' : 'text-[rgb(var(--foreground))]'}`}>
                        {typeLabel(goal.type)}
                      </p>
                      <p className="text-xs text-[rgb(var(--muted-foreground))]">Target: {goal.target_value}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(goal.id)} className="p-1.5 rounded-lg text-[rgb(var(--muted-foreground))] hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                {!goal.is_achieved && (
                  <div className="h-1.5 bg-[rgb(var(--muted))] rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAdd ? (
        <form onSubmit={handleAdd} className="border border-[rgb(var(--border))] rounded-xl p-4 space-y-3">
          <Select label="Goal type" placeholder="Choose goal..." options={goalTypeOptions} value={form.type} onChange={e => set('type', e.target.value)} />
          <Input label="Target value" type="number" placeholder="e.g. 60" value={form.target_value} onChange={e => set('target_value', e.target.value)} />
          <Input label="Deadline (optional)" type="date" value={form.deadline} onChange={e => set('deadline', e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)} className="flex-1">Cancel</Button>
            <Button type="submit" loading={loading} size="sm" className="flex-1">Add goal</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="w-full gap-2">
          <Plus size={14} /> Add goal
        </Button>
      )}
    </div>
  )
}
