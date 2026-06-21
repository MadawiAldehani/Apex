import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import AddToCartButton from '@/components/shop/AddToCartButton'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  all:          'All',
  subscription: 'Subscriptions',
  nutrition:    'Nutrition',
  gym_wear:     'Gym Wear',
  plan:         'Plans',
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const user = await getServerUser()
  const supabase = await createClient()
  const { category } = await searchParams
  const active = category && category !== 'all' ? category : null

  let query = supabase.from('products').select('*').eq('in_stock', true).order('created_at')
  if (active) query = query.eq('category', active)

  const { data: products } = await query
  const items = products ?? []

  // Cart count
  const { count: cartCount } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">Shop</h1>
          <p className="text-[rgb(var(--muted-foreground))] text-sm mt-0.5">Supplements, gear & plans</p>
        </div>
        <Link
          href="/cart"
          className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm font-medium text-[rgb(var(--foreground))] hover:border-emerald-500 transition-colors"
        >
          <ShoppingCart size={16} />
          Cart
          {(cartCount ?? 0) > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const isActive = (key === 'all' && !active) || key === active
          return (
            <Link
              key={key}
              href={key === 'all' ? '/shop' : `/shop?category=${key}`}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
                ${isActive
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-[rgb(var(--muted))] text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))]'}`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <p className="text-center py-16 text-[rgb(var(--muted-foreground))] text-sm">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((p) => (
            <Card key={p.id} className="overflow-hidden group flex flex-col">
              {/* Image */}
              <Link href={`/shop/${p.id}`} className="relative block aspect-square overflow-hidden bg-[rgb(var(--muted))]">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}
                {p.badge && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-semibold">
                    {p.badge}
                  </span>
                )}
              </Link>

              {/* Info */}
              <div className="p-3 flex flex-col flex-1 gap-2">
                <div className="flex-1">
                  <p className="text-[10px] font-medium text-emerald-500 uppercase tracking-wide">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </p>
                  <Link href={`/shop/${p.id}`}>
                    <p className="text-sm font-semibold text-[rgb(var(--foreground))] leading-snug mt-0.5 hover:text-emerald-500 transition-colors line-clamp-2">
                      {p.name}
                    </p>
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base font-bold text-[rgb(var(--foreground))]">
                    {p.price.toFixed(3)} <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">KWD</span>
                  </span>
                  <AddToCartButton productId={p.id} userId={user.id} compact />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
