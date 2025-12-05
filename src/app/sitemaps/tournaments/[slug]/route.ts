import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string))
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const host = request.headers.get('host') || undefined
    const { slug } = await params

    // Get tournament details
    const res = await db.execute(sql`select distinct league from matches where lower(league) = lower(${slug.replace(/-/g, ' ')})`)
    const tournament = (res as any).rows[0]

    if (!tournament) {
      return new NextResponse(null, { status: 404 })
    }

    const t = { slug, name: tournament.league }
    const currentYear = new Date().getFullYear()
    const seasons = [currentYear, currentYear - 1]

    const urls = seasons.map((sid: number) => createSitemapUrl(`/leagues/${t.slug}/${sid}/fixtures`, host))
      .concat(seasons.map((sid: number) => createSitemapUrl(`/leagues/${t.slug}/${sid}/results`, host)))
      .concat(seasons.map((sid: number) => createSitemapUrl(`/leagues/${t.slug}/${sid}/standings`, host)))

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`).join('\n')}\n</urlset>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    const { slug } = await params
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl(`/tournaments/${slug}`, host))}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
