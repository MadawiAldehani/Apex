import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const {
      total,
      paymentMethodId = 2,
      customerName,
      customerEmail,
      callbackUrl,
      errorUrl,
    } = await req.json()

    // Read from Vercel environment variables
    const API_KEY  = process.env.MyFatoorahAPI
    const BASE_URL = process.env.MyFatoorahURL?.replace(/\/$/, '') // strip trailing slash

    if (!API_KEY)  return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 })
    if (!BASE_URL) return NextResponse.json({ error: 'Payment gateway URL not configured.' }, { status: 500 })

    const body = {
      PaymentMethodId:    Number(paymentMethodId),
      InvoiceValue:       Number(Number(total).toFixed(3)),
      DisplayCurrencyIso: 'KWD',
      CustomerName:       customerName  || 'Apex Customer',
      CustomerEmail:      customerEmail || 'customer@apex.app',
      CallBackUrl:        callbackUrl,
      ErrorUrl:           errorUrl,
      Language:           'en',
      CustomerReference:  `apex-${Date.now()}`,
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
