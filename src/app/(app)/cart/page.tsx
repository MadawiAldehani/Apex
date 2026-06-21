import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import CartControls from '@/components/shop/CartControls'
import CheckoutButton from '@/components/shop/CheckoutButton'
import Link from 'next/link'
import { ShoppingBag, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>
}) {
  const user = await getServerUser()
  const supabase = await createClient()
  const { payment } = await searchParams

  const { data: rawItems } = await supabase
    .from('cart_items')
    .select('id, quantity, product_id, products(*)')
    .eq('user_id', user.id)
    .order('created_at')

  const items = (rawItems ?? []) as unknown as {
    id: string
    quantity: number
    product_id: string
    products: {
      id: string; name: string; price: number;
      image_url: string | null; category: string; badge: string | null
    } | null
  }[]

  const subtotal = items.reduce((s, i) => s + (i.products?.price ?? 0) * i.quantity, 0)
  const isEmpty  = items.length === 0

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/shop" className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors">
          <ArrowLeft size={15} /> Shop
        </Link>
        <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">Cart</h1>
        {!isEmpty && (
          <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--muted))] text-xs font-semibold text-[rgb(var(--muted-foreground))]">
            {items.reduce((s, i) => s + i.quantity, 0)} items
          </span>
        )}
      </div>

      {/* Payment status banners */}
      {payment === 'success' && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm">Payment successful!</p>
            <p className="text-xs mt-0.5 opacity-80">Your order has been confirmed. Check your email for details.</p>
          </div>
        </div>
      )}
      {payment === 'failed' && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500">
          <XCircle size={18} className="shrink-0" />
          <div>
            <p className="font-semibold text-sm">Payment failed</p>
            <p className="text-xs mt-0.5 opacity-80">Something went wrong. Please try again.</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--muted))] flex items-center justify-center">
              <ShoppingBag size={28} className="text-[rgb(var(--muted-foreground))]" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-[rgb(var(--foreground))]">Your cart is empty</p>
              <p className="text-sm text-[rgb(var(--muted-foreground))] mt-1">Add something from the shop to get started</p>
            </div>
            <Link
              href="/shop"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
            >
              Browse shop
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Items */}
          <Card>
            <CardContent className="divide-y divide-[rgb(var(--border))] p-0">
              {items.map((item) => {
                const p = item.products
                if (!p) return null
                return (
                  <div key={item.id} className="flex items-center gap-3 p-4">
                    {/* Image */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[rgb(var(--muted))] shrink-0">
                      {p.image_url && (
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/shop/${p.id}`}>
                        <p className="text-sm font-semibold text-[rgb(var(--foreground))] leading-snug hover:text-emerald-500 transition-colors line-clamp-1">
                          {p.name}
                        </p>
                      </Link>
                      <p className="text-sm font-bold text-[rgb(var(--foreground))] mt-1">
                        {(p.price * item.quantity).toFixed(3)} <span className="text-xs font-normal text-[rgb(var(--muted-foreground))]">KWD</span>
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-[rgb(var(--muted-foreground))]">{p.price.toFixed(3)} × {item.quantity}</p>
                      )}
                    </div>

                    {/* Controls */}
                    <CartControls itemId={item.id} quantity={item.quantity} />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Order summary */}
          <Card>
            <CardContent className="space-y-3 py-4">
              <p className="text-sm font-semibold text-[rgb(var(--foreground))]">Order summary</p>
              <div className="space-y-2">
                {items.map((item) => item.products && (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-[rgb(var(--muted-foreground))] truncate mr-2">
                      {item.products.name} {item.quantity > 1 ? `×${item.quantity}` : ''}
                    </span>
                    <span className="font-medium text-[rgb(var(--foreground))] shrink-0">
                      {(item.products.price * item.quantity).toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-px bg-[rgb(var(--border))]" />
              <div className="flex justify-between font-bold text-base">
                <span className="text-[rgb(var(--foreground))]">Total</span>
                <span className="text-[rgb(var(--foreground))]">{subtotal.toFixed(3)} KWD</span>
              </div>
              <CheckoutButton total={subtotal} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
