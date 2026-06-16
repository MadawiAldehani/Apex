'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import FileUpload from '@/components/ui/FileUpload'
import { calculateBMI, todayISO } from '@/lib/utils'

export default function MeasurementLogger({ userId, defaultHeight }: { userId: string; defaultHeight?: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [reportUrl, setReportUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    date: todayISO(),
    weight: '',
    height: defaultHeight?.toString() ?? '',
    waist: '',
    hips: '',
    arms: '',
    chest: '',
    notes: '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const bmi = form.weight && form.height
    ? calculateBMI(parseFloat(form.weight), parseFloat(form.height))
    : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('body_measurements').insert({
      user_id: userId,
      date: form.date,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      waist: form.waist ? parseFloat(form.waist) : null,
      hips: form.hips ? parseFloat(form.hips) : null,
      arms: form.arms ? parseFloat(form.arms) : null,
      chest: form.chest ? parseFloat(form.chest) : null,
      bmi,
      notes: form.notes || null,
      photo_url: photoUrl,
      report_url: reportUrl,
    })
    setLoading(false)
    router.refresh()
    setPhotoUrl(null)
    setReportUrl(null)
    setForm(f => ({ ...f, weight: '', waist: '', hips: '', arms: '', chest: '', notes: '' }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Input label="Weight (kg)" type="number" placeholder="65" value={form.weight} onChange={e => set('weight', e.target.value)} />
        <Input label="Height (cm)" type="number" placeholder="165" value={form.height} onChange={e => set('height', e.target.value)} />
        {bmi && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
            <div>
              <p className="text-xs text-[rgb(var(--muted-foreground))]">BMI</p>
              <p className="text-sm font-bold text-emerald-600">{bmi}</p>
            </div>
          </div>
        )}
        <Input label="Waist (cm)" type="number" placeholder="70" value={form.waist} onChange={e => set('waist', e.target.value)} />
        <Input label="Hips (cm)" type="number" placeholder="90" value={form.hips} onChange={e => set('hips', e.target.value)} />
        <Input label="Arms (cm)" type="number" placeholder="30" value={form.arms} onChange={e => set('arms', e.target.value)} />
        <Input label="Chest (cm)" type="number" placeholder="85" value={form.chest} onChange={e => set('chest', e.target.value)} />
      </div>
      <Input label="Notes (optional)" placeholder="Feeling good..." value={form.notes} onChange={e => set('notes', e.target.value)} />

      {/* Progress photo */}
      <div>
        <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">Progress photo <span className="text-[rgb(var(--muted-foreground))] font-normal">(optional)</span></p>
        <FileUpload
          userId={userId}
          folder="body"
          accept="image/*"
          label="Upload progress photo"
          currentUrl={photoUrl}
          onUpload={(url) => setPhotoUrl(url)}
          onClear={() => setPhotoUrl(null)}
        />
      </div>

      {/* InBody / body composition report */}
      <div>
        <p className="text-sm font-medium text-[rgb(var(--foreground))] mb-1.5">InBody / body report <span className="text-[rgb(var(--muted-foreground))] font-normal">(optional)</span></p>
        <FileUpload
          userId={userId}
          folder="inbody"
          accept="image/*,.pdf,application/pdf"
          label="Upload InBody report"
          currentUrl={reportUrl}
          onUpload={(url) => setReportUrl(url)}
          onClear={() => setReportUrl(null)}
        />
      </div>

      <Button type="submit" loading={loading} className="w-full">Save measurement</Button>
    </form>
  )
}
