import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const { paymentMethodId = 2, callbackUrl, errorUrl } = await req.json()

    // ── Authenticate the request (server-side, from the session cookie) ──
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 })
    }

    // ── Recompute the total from the cart in the database ──
    // Never trust a price/total sent by the client — a tampered request could
    // otherwise pay an arbitrary amount. Prices are read fresh from `products`.
    const { data: rawItems, error: cartError } = await supabase
      .from('cart_items')
      .select('quantity, products(price)')
      .eq('user_id', user.id)

    if (cartError) {
      return NextResponse.json({ error: 'Could not load cart.' }, { status: 500 })
    }

    const items = (rawItems ?? []) as unknown as {
      quantity: number
      products: { price: number } | null
    }[]

    const total = items.reduce(
      (sum, i) => sum + (i.products?.price ?? 0) * i.quantity,
      0,
    )

    if (total <= 0) {
      return NextResponse.json({ error: 'Cart is empty.' }, { status: 400 })
    }

    // ── Read from Vercel environment variables ──
    const API_KEY  = process.env.MyFatoorahAPI
    const BASE_URL = process.env.MyFatoorahURL?.replace(/\/$/, '') // strip trailing slash

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
      return NextResponse.json(
        { error: json.Message || 'Payment initiation failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      paymentUrl: json.Data.PaymentURL,
      invoiceId:  json.Data.InvoiceId,
    })
  } catch (err) {
    console.error('[checkout]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unexpected error' },
      { status: 500 }
    )
  }
}
