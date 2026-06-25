'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

function ApexIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M8 1.5L14.5 13.5H1.5L8 1.5Z" fill="white" />
      <path d="M8 5.5L11.5 12H4.5L8 5.5Z" fill="#10b981" />
    </svg>
  )
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  // Simple password strength indicator
  const pwStrength = password.length === 0 ? 0
    : password.length < 8  ? 1
    : password.length < 12 ? 2
    : 3

  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', 'bg-red-500', 'bg-amber-400', 'bg-emerald-500']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Migrate demo data and upsert profile — runs silently, errors are safe to ignore
      try {
        await supabase.rpc('claim_demo_data')
        await supabase.from('profiles').upsert(
          { id: data.user.id, name, units: 'metric' },
          { onConflict: 'id', ignoreDuplicates: true }
        )
      } catch {
        // non-fatal — continue to dashboard regardless
      }
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--background))] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Branding */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ApexIcon size={24} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] tracking-tight">Apex</h1>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-0.5">Reach your peak</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[rgb(var(--card))] rounded-3xl p-6 border border-[rgb(var(--border))] shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-[rgb(var(--foreground))]">Create your account</h2>
            <p className="text-sm text-[rgb(var(--muted-foreground))] mt-0.5">Start tracking your peak performance</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              type="text"
              placeholder="Madawi"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 bottom-2.5 text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Password strength bar */}
              {password.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-200 ${i <= pwStrength ? strengthColor[pwStrength] : 'bg-[rgb(var(--muted))]'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${pwStrength === 1 ? 'text-red-500' : pwStrength === 2 ? 'text-amber-400' : 'text-emerald-500'}`}>
                    {strengthLabel[pwStrength]}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-sm">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full h-11">
              Create account
            </Button>
          </form>

          {/* Features teaser */}
          <div className="space-y-1.5 pt-1 border-t border-[rgb(var(--border))]">
            {['Track workouts, diet & body measurements', 'AI-powered calorie & coaching advice', 'Progress photos & InBody report uploads'].map(f => (
              <div key={f} className="flex items-center gap-2 text-xs text-[rgb(var(--muted-foreground))]">
                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[rgb(var(--muted-foreground))]">
            Already have an account?{' '}
            <Link href="/login" className="text-emerald-500 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
