'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { todayISO } from '@/lib/utils'
import { cn } from '@/lib/utils'

const EMOJIS = ['😞', '😐', '🙂', '😊', '🔥']
const LABELS = ['Terrible', 'Bad', 'Okay', 'Good', 'Amazing']

function EmojiPicker({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-2">{label}</p>
      <div className="flex gap-2">
        {EMOJIS.map((emoji, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(i + 1)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xl transition-all border',
              value === i + 1
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-110'
                : 'border-[rgb(var(--border))] hover:border-emerald-300'
            )}
            title={LABELS[i]}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function MoodLogger({ userId }: { userId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ date: todayISO(), mood: 0, energy_level: 0, notes: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.mood && !form.energy_level) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('mood_logs').insert({
      user_id: userId,
      date: form.date,
      mood: form.mood || null,
      energy_level: form.energy_level || null,
      notes: form.notes || null,
    })
    setLoading(false)
    router.refresh()
    setForm(f => ({ ...f, mood: 0, energy_level: 0, notes: '' }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
      <EmojiPicker label="How do you feel?" value={form.mood} onChange={v => setForm(f => ({ ...f, mood: v }))} />
      <EmojiPicker label="Energy level" value={form.energy_level} onChange={v => setForm(f => ({ ...f, energy_level: v }))} />
      <Input label="Notes (optional)" placeholder="Today I felt..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      <Button type="submit" loading={loading} className="w-full">Log mood</Button>
    </form>
  )
}
