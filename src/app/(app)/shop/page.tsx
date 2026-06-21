import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import { Card } from '@/components/ui/Card'
import AddToCartButton from '@/components/shop/AddToCartButton'
import Link from 'next/link'
import { ShoppingCart, LayoutGrid, List } from 'lucide-react'

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
  searchParams: Promise<{ category?: string; view?: string }>
}) {
  const user = await getServerUser()
  const supabase = await createClient()
  const { category, view } = await searchParams
  const active   = category && category !== 'all' ? category : null
  const isAppView = view === 'app'

  let query = supabase.from('products').select('*').eq('in_stock', true).order('created_at')
  if (active) query = query.eq('category', active)

  const { data: products } = await query
  const items = products ?? []

  const { count: cartCount } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Build URL helper preserving current filters
  const shopUrl = (params: Record<string, string | undefined>) => {
    const p = new URLSearchParams()
    if (params.category && params.category !== 'all') p.set('category', params.category)
    if (params.view && params.view !== 'grid') p.set('view', params.view)
    const s = p.toString()
    return s ? `/shop?${s}` : '/shop'
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[rgb(var(--foreground))]">Shop</h1>
          <p className="text-[rgb(var(--muted-foreground))] text-sm mt-0.5">Supplements, gear &amp; plans</p>
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

      {/* Filters row — categories + view toggle */}
      <div className="flex items-center gap-2">
        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const isActive = (key === 'all' && !active) || key === active
            return (
              <Link
                key={key}
                href={shopUrl({ category: key, view: isAppView ? 'app' : undefined })}
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

        {/* View toggle */}
        <div className="flex shrink-0 rounded-xl border border-[rgb(var(--border))] overflow-hidden">
          <Link
            href={shopUrl({ category: active ?? 'all', view: 'grid' })}
            title="Grid view"
            className={`flex items-center justify-center w-9 h-9 transition-colors
              ${!isAppView
                ? 'bg-emerald-500 text-white'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]'}`}
          >
            <LayoutGrid size={15} />
          </Link>
          <Link
            href={shopUrl({ category: active ?? 'all', view: 'app' })}
            title="App view"
            className={`flex items-center justify-center w-9 h-9 transition-colors border-l border-[rgb(var(--border))]
              ${isAppView
                ? 'bg-emerald-500 text-white'
                : 'text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] hover:bg-[rgb(var(--muted))]'}`}
          >
            <List size={15} />
          </Link>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <p className="text-center py-16 text-[rgb(var(--muted-foreground))] text-sm">No products found.</p>
      )}

      {/* ── APP VIEW (list) ── */}
      {isAppView && items.length > 0 && (
        <div className="space-y-3">
          {items.map((p) => (
            <Card key={p.id} className="overflow-hidden group">
              <div className="flex gap-0">
                {/* Square image */}
                <Link
                  href={`/shop/${p.id}`}
                  className="relative w-28 shrink-0 overflow-hidden bg-[rgb(var(--muted))]"
                >
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  {p.badge && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-semibold">
                      {p.badge}
                    </span>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 flex flex-col gap-1 p-4 min-w-0">
                  <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wide">
                    {CATEGORY_LABELS[p.category] ?? p.category}
                  </p>
                  <Link href={`/shop/${p.id}`}>
                    <p className="text-sm font-bold text-[rgb(var(--foreground))] hover:text-emerald-500 transition-colors leading-snug">
                      {p.name}
                    </p>
                  </Link>
                  <p className="text-xs text-[rgb(var(--muted-foreground))] line-clamp-2 leading-relaxed flex-1">
                    {p.description}
                  </p>
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-[rgb(var(--border))]">
                    <span className="text-base font-bold text-[rgb(var(--foreground))]">
                      {p.price.toFixed(3)}{' '}
                      <span className="text-xs font-normal text-[rgb(var(--muted-foreground))]">KWD</span>
                    </span>
                    <AddToCartButton productId={p.id} userId={user.id} compact />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── GRID VIEW (default) ── */}
      {!isAppView && items.length > 0 && (
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
                    {p.price.toFixed(3)}{' '}
                    <span className="text-xs font-medium text-[rgb(var(--muted-foreground))]">KWD</span>
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
