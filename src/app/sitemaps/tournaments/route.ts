import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'

function slugify(input: string): string {
  return (input || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', '\'': '&apos;' }[c] as string))
}

export async function GET(request: Request) {
  try {
    const host = request.headers.get('host') || undefined
    // Get all leagues (tournaments)
    const res = await db.execute(sql`select distinct league from matches where league is not null order by league`)
    const leagues: string[] = (res as any).rows.map((r: any) => r.league as string)

    const urls: string[] = []

    leagues.forEach(l => {
      const slug = slugify(l)
      urls.push(createSitemapUrl(`/sitemaps/tournaments/${slug}`, host))
    })

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <sitemap>\n    <loc>${xmlEscape(u)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>`).join('\n')}\n</sitemapindex>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl('/tournaments', host))}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
