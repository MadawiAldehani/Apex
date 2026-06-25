import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { paymentMethodId = 2 } = await req.json()

    // ── Authenticate the request (server-side, from the session cookie) ──
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    // ── Recompute the total from the cart in the database ─────────────────
    // Never trust a price/total sent by the client.
    const { data: rawItems, error: cartError } = await supabase
      .from('cart_items')
      .select('quantity, products(price, name)')
      .eq('user_id', user.id)

    if (cartError) {
      console.error('[checkout] Cart fetch error:', cartError)
      return NextResponse.json({ error: 'Could not load cart.' }, { status: 500 })
    }

    const items = (rawItems ?? []) as unknown as {
      quantity: number
      products: { price: number; name: string } | null
    }[]

    const total = items.reduce(
      (sum, i) => sum + (i.products?.price ?? 0) * i.quantity,
      0,
    )

    if (total <= 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    // ── Build callback URLs server-side (never trust client-supplied URLs) ─
    const origin      = new URL(req.url).origin
    const callbackUrl = `${origin}/api/payment/callback`
    const errorUrl    = `${origin}/payment/error`

    // ── Read from environment variables ───────────────────────────────────
    const API_KEY  = process.env.MyFatoorahAPI
    const BASE_URL = process.env.MyFatoorahURL?.replace(/\/$/, '')

    if (!API_KEY)  return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 })
    if (!BASE_URL) return NextResponse.json({ error: 'Payment gateway URL not configured.' }, { status: 500 })

    const body = {
      PaymentMethodId:    Number(paymentMethodId),
      InvoiceValue:       Number(total.toFixed(3)),
      DisplayCurrencyIso: 'KWD',
      CustomerName:       user.user_metadata?.name || 'Apex Customer',
      CustomerEmail:      user.email               || 'customer@apex.app',
      CallBackUrl:        callbackUrl,
      ErrorUrl:           errorUrl,
      Language:           'en',
      CustomerReference:  `apex-${user.id}`,
    }

    const res = await fetch(`${BASE_URL}/v2/ExecutePayment`, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(body),
    })

    const json = await res.json()

    if (!json.IsSuccess) {
      console.error('[checkout] Gateway error:', json.Message)
      return NextResponse.json(
        { error: json.Message || 'Payment initiation failed.' },
        { status: 400 }
      )
    }

    const { PaymentURL: paymentUrl, InvoiceId: invoiceId } = json.Data

    // ── Record a pending order (idempotent write via unique invoice_id) ────
    // This is the server-side source of truth. The callback verifies payment
    // and marks it paid — the success page NEVER marks orders paid itself.
    const orderItems = items
      .filter(i => i.products)
      .map(i => ({ name: i.products!.name, quantity: i.quantity, price: i.products!.price }))

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id:    user.id,
        invoice_id: String(invoiceId),
        amount:     Number(total.toFixed(3)),
        currency:   'KWD',
        status:     'pending',
        items:      orderItems,
      })

    if (orderError) {
      console.error('[checkout] Failed to create pending order:', orderError)
      // Non-fatal: payment can still proceed; callback will still record it
    }

    return NextResponse.json({ paymentUrl, invoiceId })
  } catch (err) {
    // H1 fix: never return err.message — log server-side only
    console.error('[checkout]', err)
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 })
  }
}
