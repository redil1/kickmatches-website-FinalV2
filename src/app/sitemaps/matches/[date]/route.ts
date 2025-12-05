import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { createSitemapUrl } from '@/utils/url'

export const revalidate = 300
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string))
}

export async function GET(request: Request, { params }: { params: Promise<{ date: string }> }) {
  try {
    const host = request.headers.get('host') || undefined
    const { date } = await params

    // Get matches for this date
    const res = await db.execute(sql`
      select slug, event_id, kickoff_iso, league 
      from matches 
      where date(kickoff_iso) = ${date}::date
    `)
    const matchesList = (res as any).rows

    const urls: string[] = []

    matchesList.forEach((m: any) => {
      // Match detail page
      if (m.event_id) {
        urls.push(createSitemapUrl(`/m/${m.event_id}-${m.slug}`, host))
      }
      // Watch page
      urls.push(createSitemapUrl(`/watch/${m.slug}`, host))
    })

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>`).join('\n')}\n</urlset>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    const { date } = await params
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl(`/matches/${date}`, host))}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
