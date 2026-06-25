/**
 * Convert a stored file reference (storage path or legacy public URL)
 * to a secure /api/media proxy URL.
 *
 * Files are now stored as storage paths ("folder/uid/file.ext").
 * Legacy DB rows may still contain full Supabase public URLs — both are handled.
 *
 * Local blob/data URLs (from FileReader previews) are returned unchanged.
 */
export function mediaSrc(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined

  // Already a proxy URL or a local preview — return as-is
  if (
    pathOrUrl.startsWith('/api/media') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl
  }

  let storagePath: string

  if (pathOrUrl.includes('/tracking-progress/')) {
    // Legacy full Supabase Storage public URL → extract path after bucket name
    const marker = '/tracking-progress/'
    storagePath = pathOrUrl.slice(pathOrUrl.indexOf(marker) + marker.length)
    // Strip any Supabase URL query params (e.g. ?token=...)
    storagePath = storagePath.split('?')[0]
  } else if (pathOrUrl.startsWith('http')) {
    // Unknown external URL (e.g. OAuth avatar, product CDN) — pass through
    return pathOrUrl
  } else {
    // Plain storage path
    storagePath = pathOrUrl
  }

  return `/api/media?path=${encodeURIComponent(storagePath)}`
}
