import Link from 'next/link'
import { LayoutDashboard, ShoppingBag } from 'lucide-react'

function ApexIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" fill="white" />
      <path d="M8 5.5L11.5 12H4.5L8 5.5Z" fill="#10b981" />
    </svg>
  )
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex flex-col items-center justify-center p-6">
      {/* Apex logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <ApexIcon />
        </div>
        <span className="font-bold text-lg text-[rgb(var(--foreground))] tracking-tight">Apex</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[rgb(var(--card))] rounded-3xl border border-[rgb(var(--border))] shadow-sm p-8 flex flex-col items-center gap-6 text-center">

        {/* Animated checkmark */}
        <div className="relative">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline
                points="20 6 9 17 4 12"
                style={{
                  strokeDasharray: 30,
                  strokeDashoffset: 0,
                  animation: 'draw-check 0.5s ease 0.2s both',
                }}
              />
            </svg>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Payment successful!</h1>
          <p className="text-sm text-[rgb(var(--muted-foreground))] leading-relaxed">
            Your order has been confirmed and is being processed. You&apos;ll receive a confirmation email shortly.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[rgb(var(--border))]" />

        {/* CTAs */}
        <div className="w-full space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
          >
            <LayoutDashboard size={15} />
            Go to Dashboard
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[rgb(var(--border))] text-sm font-medium text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <ShoppingBag size={15} />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* Inline animation style */}
      <style>{`
        @keyframes draw-check {
          from { stroke-dashoffset: 30; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}
