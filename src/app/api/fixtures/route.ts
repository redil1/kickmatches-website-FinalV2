import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from '@/middleware.rate-limit'

// Proxy for custom football API
export async function GET(req: NextRequest) {
  const limited = await applyRateLimit(req)
  if (limited) return limited
  const url = new URL(req.url)
  const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10)

  const resp = await fetch(`http://155.117.46.251:8004/football/events/scheduled?date=${date}`, {
    headers: {
      'host': '155.117.46.251:8004',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'accept': 'application/json',
      'referer': 'http://155.117.46.251:8004/docs',
      'accept-encoding': 'gzip, deflate',
      'accept-language': 'en-US,en;q=0.9'
    },
    next: { revalidate: 60 },
  })

  const json = await resp.json().catch(() => ({ success: false, data: { events: [] } }))
  const res = NextResponse.json(json, { status: resp.status })
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return res
}


