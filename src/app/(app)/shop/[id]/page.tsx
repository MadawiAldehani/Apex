import { createClient } from '@/lib/supabase/server'
import { getServerUser } from '@/lib/auth'
import AddToCartButton from '@/components/shop/AddToCartButton'
import Link from 'next/link'
import { ArrowLeft, ShoppingCart, Tag } from 'lucide-react'
import { notFound } from 'next/navigation'

const CATEGORY_LABELS: Record<string, string> = {
  subscription: 'Subscriptions',
  nutrition:    'Nutrition',
  gym_wear:     'Gym Wear',
  plan:         'Plans',
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getServerUser()
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  // Cart count for badge
  const { count: cartCount } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Back + cart nav */}
      <div className="flex items-center justify-between">
        <Link
          href="/shop"
          className="flex items-center gap-1.5 text-sm text-[rgb(var(--muted-foreground))] hover:text-[rgb(var(--foreground))] transition-colors"
        >
          <ArrowLeft size={15} /> Shop
        </Link>
        <Link
          href="/cart"
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--border))] text-sm font-medium text-[rgb(var(--foreground))] hover:border-emerald-500 transition-colors"
        >
          <ShoppingCart size={15} /> Cart
          {(cartCount ?? 0) > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
      </div>

      {/* Product layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Image */}
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-[rgb(var(--muted))]">
          {product.image_url && (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          )}
          {product.badge && (
            <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-semibold">
              {product.badge}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          {/* Category */}
          <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold uppercase tracking-wide">
            <Tag size={11} />
            {CATEGORY_LABELS[product.category] ?? product.category}
          </div>

          {/* Name + price */}
          <div>
            <h1 className="text-2xl font-bold text-[rgb(var(--foreground))] leading-tight">{product.name}</h1>
            <p className="text-3xl font-bold text-[rgb(var(--foreground))] mt-3">
              {product.price.toFixed(3)}
              <span className="text-base font-medium text-[rgb(var(--muted-foreground))] ml-1">KWD</span>
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-[rgb(var(--border))]" />

          {/* Description */}
          <p className="text-sm text-[rgb(var(--muted-foreground))] leading-relaxed">{product.description}</p>

          {/* Stock badge */}
          <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${product.in_stock ? 'text-emerald-500' : 'text-red-500'}`}>
            <span className={`w-2 h-2 rounded-full ${product.in_stock ? 'bg-emerald-500' : 'bg-red-500'}`} />
            {product.in_stock ? 'In stock' : 'Out of stock'}
          </div>

          {/* Add to cart */}
          {product.in_stock && (
            <div className="mt-auto">
              <AddToCartButton productId={product.id} userId={user.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
