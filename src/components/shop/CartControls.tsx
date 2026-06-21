'use client'
import { useState } from 'react'
import { Minus, Plus, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  itemId: string
  quantity: number
}

export default function CartControls({ itemId, quantity }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'inc' | 'dec' | 'del' | null>(null)

  const update = async (action: 'inc' | 'dec' | 'del') => {
    setLoading(action)
    const supabase = createClient()

    if (action === 'del' || (action === 'dec' && quantity <= 1)) {
      await supabase.from('cart_items').delete().eq('id', itemId)
    } else {
      const newQty = action === 'inc' ? quantity + 1 : quantity - 1
      await supabase.from('cart_items').update({ quantity: newQty }).eq('id', itemId)
    }

    setLoading(null)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 bg-[rgb(var(--muted))] rounded-xl p-1">
        <button
          onClick={() => update('dec')}
          disabled={!!loading}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--border))] transition-colors disabled:opacity-40"
        >
          {loading === 'dec' ? <Loader2 size={12} className="animate-spin" /> : <Minus size={13} />}
        </button>
        <span className="w-6 text-center text-sm font-semibold text-[rgb(var(--foreground))]">{quantity}</span>
        <button
          onClick={() => update('inc')}
          disabled={!!loading}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--border))] transition-colors disabled:opacity-40"
        >
          {loading === 'inc' ? <Loader2 size={12} className="animate-spin" /> : <Plus size={13} />}
        </button>
      </div>
      <button
        onClick={() => update('del')}
        disabled={!!loading}
        className="w-8 h-8 rounded-xl flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
      >
        {loading === 'del' ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </div>
  )
}
