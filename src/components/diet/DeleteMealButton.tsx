'use client'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DeleteMealButton({ mealId }: { mealId: string }) {
  const router = useRouter()
  const handleDelete = async () => {
    const supabase = createClient()
    await supabase.from('meals').delete().eq('id', mealId)
    router.refresh()
  }
  return (
    <button onClick={handleDelete} className="p-1.5 rounded-lg text-[rgb(var(--muted-foreground))] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors">
      <Trash2 size={14} />
    </button>
  )
}
