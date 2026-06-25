'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import FileUpload from '@/components/ui/FileUpload'
import { Profile } from '@/types'
import { CheckCircle2 } from 'lucide-react'
import { mediaSrc } from '@/lib/media'

const activityOptions = [
  { value: 'gym', label: 'Gym' },
  { value: 'pilates', label: 'Pilates' },
  { value: 'walking', label: 'Walking' },
  { value: 'lagree', label: 'Lagree' },
  { value: 'other', label: 'Other' },
]
const goalOptions = [
  { value: 'weight_loss', label: 'Lose Weight' },
  { value: 'muscle_gain', label: 'Build Muscle' },
  { value: 'maintenance', label: 'Maintain Weight' },
  { value: 'endurance', label: 'Improve Endurance' },
]
const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'other', label: 'Other' },
]

export default function ProfileEditor({ userId, profile }: { userId: string; profile: Profile | null }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)
  const [form, setForm] = useState({
    name: profile?.name ?? '',
    age: profile?.age?.toString() ?? '',
    gender: profile?.gender ?? '',
    weight: profile?.weight?.toString() ?? '',
    height: profile?.height?.toString() ?? '',
    target_weight: profile?.target_weight?.toString() ?? '',
    target_date: profile?.target_date ?? '',
    activity_type: profile?.activity_type ?? '',
    goal: profile?.goal ?? '',
    units: profile?.units ?? 'metric',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleAvatarUpload = async (url: string) => {
    setAvatarUrl(url)
    const supabase = createClient()
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId)
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('profiles').upsert({
      id: userId,
      name: form.name,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      target_weight: form.target_weight ? parseFloat(form.target_weight) : null,
      target_date: form.target_date || null,
      activity_type: form.activity_type || null,
      goal: form.goal || null,
      units: form.units,
      avatar_url: avatarUrl,
    })
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Profile photo */}
      <div className="flex items-center gap-4 pb-2">
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={mediaSrc(avatarUrl) ?? avatarUrl}
              alt="Profile photo"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400"
              onError={(e) => { setAvatarUrl(null) }}
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-3xl font-bold">
              {form.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-1">Profile photo</p>
          <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">JPG, PNG, WEBP, HEIC — auto-converted</p>
          <FileUpload
            userId={userId}
            folder="profile"
            accept="image/*"
            label="Upload photo"
            currentUrl={avatarUrl}
            onUpload={handleAvatarUpload}
            onClear={() => { setAvatarUrl(null) }}
            compact
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Full name" value={form.name} onChange={e => set('name', e.target.value)} required />
        <Input label="Age" type="number" value={form.age} onChange={e => set('age', e.target.value)} />
        <Select label="Gender" placeholder="Select" options={genderOptions} value={form.gender} onChange={e => set('gender', e.target.value)} />
        <Select label="Units" options={[{ value: 'metric', label: 'Metric (kg/cm)' }, { value: 'imperial', label: 'Imperial (lbs/in)' }]} value={form.units} onChange={e => set('units', e.target.value)} />
        <Input label={`Weight (${form.units === 'metric' ? 'kg' : 'lbs'})`} type="number" value={form.weight} onChange={e => set('weight', e.target.value)} />
        <Input label={`Height (${form.units === 'metric' ? 'cm' : 'in'})`} type="number" value={form.height} onChange={e => set('height', e.target.value)} />
        <Input label={`Target weight (${form.units === 'metric' ? 'kg' : 'lbs'})`} type="number" value={form.target_weight} onChange={e => set('target_weight', e.target.value)} />
        <Input label="Target date" type="date" value={form.target_date} onChange={e => set('target_date', e.target.value)} />
        <Select label="Goal" placeholder="Select goal" options={goalOptions} value={form.goal} onChange={e => set('goal', e.target.value)} />
        <Select label="Preferred activity" placeholder="Select activity" options={activityOptions} value={form.activity_type} onChange={e => set('activity_type', e.target.value)} />
      </div>
      <Button type="submit" loading={loading} className="w-full gap-2">
        {saved ? <><CheckCircle2 size={16} /> Saved!</> : 'Save changes'}
      </Button>
    </form>
  )
}
