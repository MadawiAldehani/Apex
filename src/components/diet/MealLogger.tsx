'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import FileUpload from '@/components/ui/FileUpload'
import { todayISO } from '@/lib/utils'
import { Heart, Loader2, Sparkles, Camera, AlertCircle } from 'lucide-react'

const mealTypeOptions = [
  { value: 'breakfast', label: '🌅 Breakfast' },
  { value: 'lunch', label: '☀️ Lunch' },
  { value: 'dinner', label: '🌙 Dinner' },
  { value: 'snack', label: '🍎 Snack' },
]

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error' | 'unconfigured'

export default function MealLogger({ userId, favorites }: { userId: string; favorites: { name: string; meal_type: string; calories?: number; protein_g?: number; carbs_g?: number; fat_g?: number }[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle')
  const [form, setForm] = useState({
    date: todayISO(),
    meal_type: 'breakfast',
    name: '',
    calories: '',
    protein_g: '',
    carbs_g: '',
    fat_g: '',
    is_favorite: false,
  })

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }))

  const applyFavorite = (fav: typeof favorites[0]) => {
    setForm(f => ({
      ...f,
      name: fav.name,
      meal_type: fav.meal_type,
      calories: fav.calories?.toString() ?? '',
      protein_g: fav.protein_g?.toString() ?? '',
      carbs_g: fav.carbs_g?.toString() ?? '',
      fat_g: fav.fat_g?.toString() ?? '',
    }))
    setAnalysisState('idle')
  }

  const handleImageUpload = async (url: string) => {
    setImageUrl(url)
    setAnalysisState('analyzing')

    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storagePath: url }),
      })

      if (res.status === 503) {
        // API key not configured — still save the photo but don't fill fields
        setAnalysisState('unconfigured')
        return
      }

      if (!res.ok) {
        setAnalysisState('error')
        return
      }

      const data = await res.json()
      if (data.error) {
        setAnalysisState('error')
        return
      }

      // Auto-fill the form with AI estimates (only fill if field is currently empty)
      setForm(f => ({
        ...f,
        name: f.name.trim() || (data.name ?? f.name),
        calories: f.calories || (data.calories != null ? String(data.calories) : f.calories),
        protein_g: f.protein_g || (data.protein_g != null ? String(data.protein_g) : f.protein_g),
        carbs_g: f.carbs_g || (data.carbs_g != null ? String(data.carbs_g) : f.carbs_g),
        fat_g: f.fat_g || (data.fat_g != null ? String(data.fat_g) : f.fat_g),
      }))
      setAnalysisState('done')
    } catch {
      setAnalysisState('error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('meals').insert({
      user_id: userId,
      date: form.date,
      meal_type: form.meal_type,
      name: form.name,
      calories: form.calories ? parseInt(form.calories) : null,
      protein_g: form.protein_g ? parseFloat(form.protein_g) : null,
      carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : null,
      fat_g: form.fat_g ? parseFloat(form.fat_g) : null,
      is_favorite: form.is_favorite,
      image_url: imageUrl,
    })
    setLoading(false)
    router.refresh()
    setImageUrl(null)
    setAnalysisState('idle')
    setForm(f => ({ ...f, name: '', calories: '', protein_g: '', carbs_g: '', fat_g: '', is_favorite: false }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {favorites.length > 0 && (
        <div>
          <p className="text-xs text-[rgb(var(--muted-foreground))] mb-2">Quick add from favorites</p>
          <div className="flex flex-wrap gap-2">
            {favorites.slice(0, 5).map((fav, i) => (
              <button key={i} type="button" onClick={() => applyFavorite(fav)}
                className="px-3 py-1 rounded-full text-xs bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] hover:bg-emerald-100 hover:text-emerald-700 transition-colors flex items-center gap-1">
                <Heart size={10} fill="currentColor" className="text-emerald-500" /> {fav.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date" type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        <Select label="Meal type" options={mealTypeOptions} value={form.meal_type} onChange={e => set('meal_type', e.target.value)} />
      </div>

      {/* Food photo upload — triggers AI analysis */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Camera size={13} className="text-[rgb(var(--muted-foreground))]" />
          <span className="text-sm font-medium text-[rgb(var(--foreground))]">Food photo</span>
          <span className="text-xs text-[rgb(var(--muted-foreground))]">(optional · AI estimates calories from photo)</span>
        </div>

        <FileUpload
          userId={userId}
          folder="food"
          accept="image/*"
          label="Take or upload a photo of your meal"
          currentUrl={imageUrl}
          onUpload={handleImageUpload}
          onClear={() => { setImageUrl(null); setAnalysisState('idle') }}
        />

        {/* Analysis status banner */}
        {analysisState === 'analyzing' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm">
            <Loader2 size={14} className="animate-spin shrink-0" />
            Analysing your meal…
          </div>
        )}
        {analysisState === 'done' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-sm">
            <Sparkles size={14} className="shrink-0" />
            Nutrition estimated by AI — edit any values below if needed
          </div>
        )}
        {analysisState === 'unconfigured' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs">
            <AlertCircle size={13} className="shrink-0" />
            Photo saved. Add <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">ANTHROPIC_API_KEY</code> to <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> to enable AI estimation.
          </div>
        )}
        {analysisState === 'error' && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs">
            <AlertCircle size={13} className="shrink-0" />
            Could not estimate nutrition — fill in the fields manually.
          </div>
        )}
      </div>

      {/* Food name row */}
      <div className="flex gap-2 items-end">
        <Input label="Food name" placeholder="Grilled chicken breast" value={form.name} onChange={e => set('name', e.target.value)} required />
        <button type="button" onClick={() => set('is_favorite', !form.is_favorite)}
          className={`h-10 px-3 rounded-xl border transition-colors flex items-center ${form.is_favorite ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'border-[rgb(var(--border))] text-[rgb(var(--muted-foreground))]'}`}
          title="Save as favorite">
          <Heart size={16} fill={form.is_favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Nutrition fields */}
      <div>
        {analysisState === 'done' && (
          <p className="flex items-center gap-1 text-[10px] text-emerald-500 mb-2">
            <Sparkles size={10} /> AI estimated — tap any field to edit
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Calories (kcal)" type="number" placeholder="300" value={form.calories} onChange={e => set('calories', e.target.value)} />
          <Input label="Protein (g)" type="number" placeholder="30" value={form.protein_g} onChange={e => set('protein_g', e.target.value)} />
          <Input label="Carbs (g)" type="number" placeholder="25" value={form.carbs_g} onChange={e => set('carbs_g', e.target.value)} />
          <Input label="Fat (g)" type="number" placeholder="10" value={form.fat_g} onChange={e => set('fat_g', e.target.value)} />
        </div>
      </div>

      <Button type="submit" loading={loading} className="w-full">Add meal</Button>
    </form>
  )
}
