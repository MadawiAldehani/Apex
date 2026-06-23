import Link from 'next/link'
import { ShoppingCart, ShoppingBag, LayoutDashboard } from 'lucide-react'

function ApexIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" fill="white" />
      <path d="M8 5.5L11.5 12H4.5L8 5.5Z" fill="#10b981" />
    </svg>
  )
}

export default function PaymentErrorPage() {
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

        {/* Error icon */}
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[rgb(var(--foreground))]">Payment failed</h1>
          <p className="text-sm text-[rgb(var(--muted-foreground))] leading-relaxed">
            Something went wrong during checkout. Your card was not charged. Please try again or choose a different payment method.
          </p>
        </div>

        {/* What to do next */}
        <div className="w-full p-4 rounded-2xl bg-[rgb(var(--muted))] text-left space-y-2">
          <p className="text-xs font-semibold text-[rgb(var(--foreground))]">Common reasons</p>
          <ul className="space-y-1">
            {[
              'Insufficient card balance',
              'Transaction declined by bank',
              'Session timed out during payment',
              'Network error',
            ].map(r => (
              <li key={r} className="flex items-start gap-1.5 text-xs text-[rgb(var(--muted-foreground))]">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[rgb(var(--muted-foreground))] shrink-0" />
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-[rgb(var(--border))]" />

        {/* CTAs */}
        <div className="w-full space-y-3">
          <Link
            href="/cart"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
          >
            <ShoppingCart size={15} />
            Try Again
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-[rgb(var(--border))] text-sm font-medium text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))] transition-colors"
          >
            <ShoppingBag size={15} />
            Back to Shop
          </Link>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full h-11 text-sm font-medium text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
          >
            <LayoutDashboard size={14} />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
