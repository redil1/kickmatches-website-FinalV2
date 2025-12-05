import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { createSitemapUrl } from '@/utils/url'

export const revalidate = 300
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string))
}

function format(d: Date) {
  return d.toISOString().split('T')[0]
}

export async function GET(request: Request) {
  try {
    const host = request.headers.get('host') || undefined
    const res = await db.execute(sql`select distinct date(kickoff_iso) as day from matches order by day desc`)
    const days: string[] = (res as any).rows.map((r: any) => r.day as string)

    const urls: string[] = []

    days.forEach(d => {
      // Format date as YYYY-MM-DD
      const date = new Date(d).toISOString().split('T')[0]
      urls.push(createSitemapUrl(`/sitemaps/matches/${date}`, host))
    })

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <sitemap>\n    <loc>${xmlEscape(u)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>`).join('\n')}\n</sitemapindex>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl('/matches', host))}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
