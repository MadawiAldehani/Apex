'use client'
import { useState } from 'react'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

interface Props {
  total: number
}

export default function CheckoutButton({ total }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  const handleCheckout = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const origin      = window.location.origin
      const callbackUrl = `${origin}/cart?payment=success`
      const errorUrl    = `${origin}/cart?payment=failed`

      const res = await fetch(`${SUPABASE_URL}/functions/v1/myfatoorah-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': ANON_KEY,
          'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({
          total,
          customerName:  user?.user_metadata?.name || 'Apex Customer',
          customerEmail: user?.email || 'customer@apex.app',
          callbackUrl,
          errorUrl,
        }),
      })

      const data = await res.json()
      if (data.error) throw new Error(data.error)
      if (!data.paymentUrl) throw new Error('No payment URL returned')

      window.location.href = data.paymentUrl
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Checkout failed. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading || total <= 0}
        className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
      >
        {loading
          ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
          : <><CreditCard size={16} /> Pay {total.toFixed(3)} KWD</>}
      </button>
      <p className="text-center text-[10px] text-[rgb(var(--muted-foreground))]">
        Secured by MyFatoorah · KNET accepted
      </p>
    </div>
  )
}
