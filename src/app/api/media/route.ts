import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Authenticated media proxy for the private tracking-progress bucket.
 * GET /api/media?path=<storage-path>
 *
 * Authenticates the requesting user and enforces ownership — the user's
 * uid must be the 2nd path segment (<folder>/<uid>/<filename>).
 * This mirrors the bucket's RLS policy and provides defence-in-depth.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new NextResponse('Unauthorized', { status: 401 })

    const path = req.nextUrl.searchParams.get('path')
    if (!path) return new NextResponse('Missing path', { status: 400 })

    // Defence-in-depth: uid must be the 2nd segment (<folder>/<uid>/...)
    // Matches the bucket RLS: (storage.foldername(name))[2] = auth.uid()
    const segments = path.split('/')
    if (segments.length < 3 || segments[1] !== user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Download via the authed server client — RLS enforces ownership
    const { data, error } = await supabase.storage
      .from('tracking-progress')
      .download(path)

    if (error || !data) {
      return new NextResponse('Not found', { status: 404 })
    }

    return new NextResponse(data, {
      headers: {
        'Content-Type': data.type || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new NextResponse('Server error', { status: 500 })
  }
}
