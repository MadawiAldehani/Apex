import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * MyFatoorah payment callback (A08 / C1 fix).
 *
 * MyFatoorah redirects the user's browser here after payment with ?paymentId=<id>.
 * We verify the payment server-to-server (GetPaymentStatus), confirm the amount
 * matches what we recorded in the pending order, mark it paid, clear the cart,
 * then redirect to the success page.
 *
 * Nothing here trusts the client — the source of truth is MyFatoorah + our DB.
 */
export async function GET(req: NextRequest) {
  const BASE_URL = process.env.MyFatoorahURL?.replace(/\/$/, '')
  const API_KEY  = process.env.MyFatoorahAPI

  // MyFatoorah uses ?paymentId or ?Id depending on gateway version
  const paymentId = req.nextUrl.searchParams.get('paymentId')
    ?? req.nextUrl.searchParams.get('Id')

  const errorUrl = new URL('/payment/error', req.url)

  if (!paymentId || !API_KEY || !BASE_URL) {
    console.error('[callback] Missing paymentId or gateway config')
    return NextResponse.redirect(errorUrl)
  }

  try {
    // ── 1. Verify payment with MyFatoorah (server-to-server) ──────────────
    const statusRes = await fetch(`${BASE_URL}/v2/GetPaymentStatus`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ KeyType: 'PaymentId', Key: paymentId }),
    })
    const statusJson = await statusRes.json()

    if (!statusJson.IsSuccess || statusJson.Data?.InvoiceStatus !== 'Paid') {
      console.error('[callback] Payment not confirmed:', statusJson?.Message)
      return NextResponse.redirect(errorUrl)
    }

    const { InvoiceId, InvoiceValue } = statusJson.Data

    // ── 2. Authenticate the user via session cookie ────────────────────────
    // Browser redirects from payment gateways preserve session cookies.
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      // Session expired during payment — redirect to login
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('next', req.nextUrl.pathname + req.nextUrl.search)
      return NextResponse.redirect(loginUrl)
    }

    // ── 3. Find the pending order (idempotency guard) ──────────────────────
    const { data: order } = await supabase
      .from('orders')
      .select('id, status, amount')
      .eq('invoice_id', String(InvoiceId))
      .eq('user_id', user.id)
      .single()

    if (!order) {
      console.error('[callback] Order not found for invoice:', InvoiceId)
      return NextResponse.redirect(errorUrl)
    }

    if (order.status === 'paid') {
      // Duplicate callback — idempotent, redirect to success
      return NextResponse.redirect(new URL(`/payment/success?orderId=${order.id}`, req.url))
    }

    // ── 4. Verify paid amount matches what we recorded ─────────────────────
    const recordedAmount = Number(Number(order.amount).toFixed(3))
    const paidAmount     = Number(Number(InvoiceValue).toFixed(3))
    if (Math.abs(recordedAmount - paidAmount) > 0.001) {
      console.error('[callback] Amount mismatch — recorded:', recordedAmount, 'paid:', paidAmount)
      return NextResponse.redirect(errorUrl)
    }

    // ── 5. Mark order paid ─────────────────────────────────────────────────
    await supabase
      .from('orders')
      .update({
        status:     'paid',
        payment_id: paymentId,
        paid_at:    new Date().toISOString(),
      })
      .eq('id', order.id)

    // ── 6. Clear the cart ──────────────────────────────────────────────────
    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)

    return NextResponse.redirect(new URL(`/payment/success?orderId=${order.id}`, req.url))
  } catch (err) {
    console.error('[callback] Unexpected error:', err)
    return NextResponse.redirect(errorUrl)
  }
}
