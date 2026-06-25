import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking (frame-ancestors supersedes X-Frame-Options in modern browsers)
  { key: 'X-Frame-Options',         value: 'DENY' },
  // Prevent MIME-type sniffing
  { key: 'X-Content-Type-Options',  value: 'nosniff' },
  // Limit referrer info sent cross-origin
  { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
  // Enforce HTTPS for 1 year (applied by Vercel at edge too, belt-and-suspenders)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Disable unnecessary browser features
  { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
