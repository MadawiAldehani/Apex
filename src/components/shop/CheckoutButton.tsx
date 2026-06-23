'use client'
import { useState } from 'react'
import { CreditCard, Loader2, AlertCircle, X, Check, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'


const PAYMENT_METHODS = [
  {
    id: 2,
    name: 'KNET',
    desc: 'Kuwait debit card',
    colors: 'from-blue-600 to-blue-800',
    logo: (
      <svg viewBox="0 0 48 24" className="w-10 h-5" fill="none">
        <rect width="48" height="24" rx="4" fill="#0047AB"/>
        <text x="4" y="17" fontSize="11" fontWeight="bold" fill="white" fontFamily="sans-serif">KNET</text>
      </svg>
    ),
  },
  {
    id: 6,
    name: 'Visa / Mastercard',
    desc: 'Credit & debit cards',
    colors: 'from-slate-700 to-slate-900',
    logo: (
      <div className="flex items-center gap-1">
        <svg viewBox="0 0 48 16" className="w-10 h-4" fill="none">
          <text x="0" y="13" fontSize="13" fontWeight="900" fill="#1A1F71" fontFamily="sans-serif" letterSpacing="-0.5">VISA</text>
        </svg>
        <div className="flex">
          <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
          <div className="w-5 h-5 rounded-full bg-amber-400 -ml-2.5 opacity-90" />
        </div>
      </div>
    ),
  },
  {
    id: 11,
    name: 'Apple Pay',
    desc: 'Pay with Face or Touch ID',
    colors: 'from-gray-800 to-black',
    logo: (
      <svg viewBox="0 0 60 24" className="w-14 h-6" fill="none">
        <path d="M11 4.5C10 5.7 8.5 6.4 7 6.3c-.2-1.5.5-3 1.4-4C9.4 1 11 .3 12.3.4c.2 1.5-.5 3-1.3 4.1zm1.3 2c-1.7-.1-3.1.9-4 .9-.8 0-2-.9-3.3-.9C3.2 6.6 1.2 7.9 0 9.9c-2.4 4.2-.7 10.4 1.7 13.8 1.1 1.7 2.5 3.5 4.2 3.5 1.7-.1 2.3-1.1 4.3-1.1 2 0 2.5 1.1 4.3 1.1 1.8 0 3-1.6 4.1-3.2 1.3-1.8 1.8-3.6 1.9-3.7-.1 0-3.6-1.4-3.6-5.5 0-3.5 2.8-5.1 2.9-5.2-1.6-2.3-4.1-2.6-5-2.7z" fill="currentColor" transform="scale(0.55) translate(2,0)"/>
        <text x="18" y="17" fontSize="11" fontWeight="600" fill="currentColor" fontFamily="-apple-system, sans-serif" letterSpacing="-0.3">Pay</text>
      </svg>
    ),
  },
  {
    id: 20,
    name: 'Benefit Pay',
    desc: 'Bahrain debit',
    colors: 'from-emerald-600 to-emerald-800',
    logo: (
      <svg viewBox="0 0 64 20" className="w-14 h-5" fill="none">
        <rect width="64" height="20" rx="3" fill="#00A651"/>
        <text x="6" y="14" fontSize="9" fontWeight="bold" fill="white" fontFamily="sans-serif">BENEFIT</text>
      </svg>
    ),
  },
]

interface Props {
  total: number
}

type Step = 'idle' | 'picker' | 'loading'

export default function CheckoutButton({ total }: Props) {
  const [step, setStep]         = useState<Step>('idle')
  const [selected, setSelected] = useState<number>(2)
  const [error, setError]       = useState<string | null>(null)

  const handlePay = async () => {
    setStep('loading')
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const origin      = window.location.origin
      const callbackUrl = `${origin}/payment/success`
      const errorUrl    = `${origin}/payment/error`

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          total,
          paymentMethodId: selected,
          customerName:  user?.user_metadata?.name  || 'Apex Customer',
          customerEmail: user?.email                || 'customer@apex.app',
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
      setStep('picker')
    }
  }

  /* ── Idle state ── */
  if (step === 'idle') {
    return (
      <div className="space-y-2">
        <button
          onClick={() => setStep('picker')}
          disabled={total <= 0}
          className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
        >
          <CreditCard size={16} />
          Proceed to Checkout · {total.toFixed(3)} KWD
          <ChevronRight size={14} className="ml-auto" />
        </button>
        <div className="flex items-center justify-center gap-3 pt-0.5">
          {/* Mini logos row */}
          <span className="text-[10px] text-[rgb(var(--muted-foreground))]">Secured by MyFatoorah</span>
          <div className="flex items-center gap-2 opacity-60">
            <span className="text-xs font-bold text-blue-700 dark:text-blue-400">KNET</span>
            <span className="text-[10px] font-semibold text-[#1A1F71] dark:text-blue-300">VISA</span>
            <div className="flex">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-400 -ml-1" />
            </div>
            <span className="text-[10px] font-semibold text-[rgb(var(--foreground))]">Pay</span>
          </div>
        </div>
      </div>
    )
  }

  /* ── Payment picker / loading ── */
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[rgb(var(--foreground))]">Choose payment</p>
          <p className="text-[10px] text-[rgb(var(--muted-foreground))]">Total: {total.toFixed(3)} KWD</p>
        </div>
        {step !== 'loading' && (
          <button
            onClick={() => { setStep('idle'); setError(null) }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[rgb(var(--muted-foreground))] hover:bg-[rgb(var(--muted))] hover:text-[rgb(var(--foreground))] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Method grid */}
      <div className="grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map(m => {
          const isSelected = selected === m.id
          return (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              disabled={step === 'loading'}
              className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-[rgb(var(--border))] hover:border-emerald-300 dark:hover:border-emerald-700 bg-[rgb(var(--card))]'
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check size={10} className="text-white" />
                </span>
              )}
              <div className="text-[rgb(var(--foreground))]">{m.logo}</div>
              <div>
                <p className="text-xs font-semibold text-[rgb(var(--foreground))] leading-tight">{m.name}</p>
                <p className="text-[10px] text-[rgb(var(--muted-foreground))] leading-tight mt-0.5">{m.desc}</p>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-xs">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={step === 'loading'}
        className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/20"
      >
        {step === 'loading'
          ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
          : <>Pay {total.toFixed(3)} KWD with {PAYMENT_METHODS.find(m => m.id === selected)?.name}</>}
      </button>
    </div>
  )
}
