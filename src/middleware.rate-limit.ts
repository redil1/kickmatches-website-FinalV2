import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { cacheIncr } from '@/utils/cache'

const WINDOW_SECONDS = 60
const MAX_REQUESTS = 120 // per IP per window

export function getClientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for')
  if (xf) {
    const ip = xf.split(',')[0]?.trim()
    if (ip) return ip
  }
  const rip = req.headers.get('x-real-ip')
  if (rip) return rip
  // Fallback to remote address info when available on Node (not part of NextRequest types)
  return 'unknown'
}

export async function applyRateLimit(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const bucket = Math.floor(Date.now() / 1000 / WINDOW_SECONDS)
    const key = `ratelimit:${ip}:${bucket}`
    const current = await cacheIncr(key, WINDOW_SECONDS + 1)
    if (current && current > MAX_REQUESTS) {
      return new NextResponse('Too Many Requests', { status: 429 })
    }
  } catch {
    // No redis available or error: skip rate limiting
  }
  return null
}
