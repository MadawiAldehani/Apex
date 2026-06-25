import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ── Per-user in-memory rate limit ────────────────────────────────────────────
// Max 10 analyses per 60 s per server instance. For multi-instance deployments
// replace with Upstash Redis or a DB-backed counter.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT    = 10
const RATE_WINDOW   = 60_000 // ms
const MAX_BYTES     = 10 * 1024 * 1024 // 10 MB

function checkRateLimit(userId: string): boolean {
  const now   = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth (H2 fix) ──────────────────────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

    // ── Rate limit ─────────────────────────────────────────────────────────
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    }

    const { storagePath } = await req.json()
    if (!storagePath || typeof storagePath !== 'string') {
      return NextResponse.json({ error: 'no_image' }, { status: 400 })
    }

    // ── SSRF fix: download via authed Supabase client, not arbitrary fetch ─
    // RLS enforces (storage.foldername(name))[2] = auth.uid(), so a user
    // can only download their own files. We also check explicitly.
    const segments = storagePath.split('/')
    if (segments.length < 3 || segments[1] !== user.id) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }

    const { data: blob, error: dlError } = await supabase.storage
      .from('tracking-progress')
      .download(storagePath)

    if (dlError || !blob) {
      return NextResponse.json({ error: 'image_not_found' }, { status: 404 })
    }

    // ── Size cap ───────────────────────────────────────────────────────────
    if (blob.size > MAX_BYTES) {
      return NextResponse.json({ error: 'image_too_large' }, { status: 413 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'not_configured' }, { status: 503 })
    }

    const imgBuf     = await blob.arrayBuffer()
    const base64Data = Buffer.from(imgBuf).toString('base64')
    const mimeType   = (blob.type || 'image/jpeg').split(';')[0]

    // ── Call Claude with vision ────────────────────────────────────────────
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-3-5-haiku-20241022',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: [
              {
                type:   'image',
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

    const apiData  = await anthropicRes.json()
    const rawText: string = apiData.content?.[0]?.text ?? ''

    const jsonMatch = rawText.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      console.error('[analyze-food] Could not parse JSON from:', rawText)
      return NextResponse.json({ error: 'parse_error' }, { status: 500 })
    }

    // ── Validate and clamp output values (LLM05) ──────────────────────────
    const raw = JSON.parse(jsonMatch[0])
    const result = {
      name:      typeof raw.name === 'string' ? raw.name.slice(0, 200) : 'Unknown food',
      calories:  Math.max(0, Math.min(10000, Math.round(Number(raw.calories)  || 0))),
      protein_g: Math.max(0, Math.min(1000,  Math.round(Number(raw.protein_g) * 10) / 10 || 0)),
      carbs_g:   Math.max(0, Math.min(1000,  Math.round(Number(raw.carbs_g)   * 10) / 10 || 0)),
      fat_g:     Math.max(0, Math.min(1000,  Math.round(Number(raw.fat_g)     * 10) / 10 || 0)),
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('[analyze-food] Unexpected error:', err)
    return NextResponse.json({ error: 'internal_error' }, { status: 500 })
  }
}
