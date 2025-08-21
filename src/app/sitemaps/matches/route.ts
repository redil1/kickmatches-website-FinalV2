import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'

export const revalidate = 300
export const dynamic = 'force-dynamic'

function format(d: Date) {
  return d.toISOString().split('T')[0]
}

export async function GET() {
  const today = new Date()
  today.setHours(0,0,0,0)

  // Build a window of dates (past 7, today, next 14)
    const dates: string[] = []
    for (let i = -90; i <= 30; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const yyyy = d.getUTCFullYear()
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
      const dd = String(d.getUTCDate()).padStart(2, '0')
      dates.push(`${yyyy}-${mm}-${dd}`)
    }

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${dates.map(date => `  <sitemap>\n    <loc>${createSitemapUrl(`/sitemaps/matches/${date}`)}</loc>\n  </sitemap>`).join('\n')}\n</sitemapindex>`

  return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
