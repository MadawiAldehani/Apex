import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json()
    if (!imageUrl) {
      return NextResponse.json({ error: 'no_image' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      // Feature works but AI is not configured — let the client show a graceful message
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }

    // Download the image from Supabase Storage and encode it as base64
    const imgRes = await fetch(imageUrl)
    if (!imgRes.ok) throw new Error(`Could not fetch image: ${imgRes.status}`)
    const imgBuf = await imgRes.arrayBuffer()
    const base64Data = Buffer.from(imgBuf).toString('base64')
    const mimeType = (imgRes.headers.get('content-type') ?? 'image/jpeg').split(';')[0]

    // Call Claude with vision
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: base64Data },
              },
              {
                type: 'text',
                text: `You are a registered dietitian with expert knowledge of food nutrition.
Examine this food photo carefully and estimate the nutritional values for the visible serving.

Reply with ONLY a JSON object — no markdown, no code fences, no extra words:
{"name":"<specific food name>","calories":<integer>,"protein_g":<number>,"carbs_g":<number>,"fat_g":<number>}

Guidelines:
- name: be specific, e.g. "Grilled chicken breast with rice" not just "chicken"
- calories: total kcal for what's visible in the photo
- protein_g / carbs_g / fat_g: grams, rounded to 1 decimal
- If multiple items are visible, estimate the combined total for the plate`,
              },
            ],
          },
        ],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      console.error('[analyze-food] Anthropic error:', anthropicRes.status, errText)
      return NextResponse.json({ error: 'api_error' }, { status: 500 })
    }

    const apiData = await anthropicRes.json()
    const rawText: string = apiData.content?.[0]?.text ?? ''

    // Extract the JSON object from the response
    const jsonMatch = rawText.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.error('[analyze-food] Could not parse JSON from:', rawText)
      return NextResponse.json({ error: 'parse_error' }, { status: 500 })
    }

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze-food] Unexpected error:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
