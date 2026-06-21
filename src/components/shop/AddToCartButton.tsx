'use client'
import { useState } from 'react'
import { ShoppingCart, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  productId: string
  userId: string
  compact?: boolean
}

export default function AddToCartButton({ productId, userId, compact = false }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'added'>('idle')

  const handleAdd = async () => {
    setState('loading')
    const supabase = createClient()

    const { data: existing } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single()

    if (existing) {
      await supabase
        .from('cart_items')
        .update({ quantity: existing.quantity + 1 })
        .eq('id', existing.id)
    } else {
      await supabase
        .from('cart_items')
        .insert({ user_id: userId, product_id: productId, quantity: 1 })
    }

    setState('added')
    setTimeout(() => setState('idle'), 2000)
  }

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        disabled={state === 'loading'}
        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0
          ${state === 'added'
            ? 'bg-emerald-500 text-white'
            : 'bg-[rgb(var(--muted))] text-[rgb(var(--foreground))] hover:bg-emerald-500 hover:text-white'}`}
      >
        {state === 'loading' ? <Loader2 size={14} className="animate-spin" />
          : state === 'added' ? <Check size={14} />
          : <ShoppingCart size={14} />}
      </button>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={state === 'loading'}
      className={`flex items-center justify-center gap-2 w-full h-11 rounded-xl font-medium text-sm transition-all
        ${state === 'added'
          ? 'bg-emerald-500 text-white'
          : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]'}`}
    >
      {state === 'loading' ? <Loader2 size={16} className="animate-spin" />
        : state === 'added' ? <><Check size={16} /> Added to cart</>
        : <><ShoppingCart size={16} /> Add to cart</>}
    </button>
  )
}
