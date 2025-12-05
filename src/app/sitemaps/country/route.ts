import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&'\"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', '\'': '&apos;' }[c] || c))
}

export async function GET(request: Request) {
  try {
    const host = request.headers.get('host') || undefined
    // Get all countries from players table
    const res = await db.execute(sql`
      select distinct country_alpha2 as alpha2 
      from players 
      where country_alpha2 is not null 
      order by country_alpha2
    `)

    // Also get countries from matches (leagues often imply country but we don't have direct mapping in matches table yet)
    // For now just use players countries as they are most reliable source of country codes

    const countries = (res as any).rows

    const urls = countries
      .filter((c: any) => c.alpha2 && c.alpha2.length === 2)
      .map((c: any) => createSitemapUrl(`/country/${(c.alpha2).toString().toUpperCase()}/football`, host))

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u: string) => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n')}\n</urlset>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl('/country', host))}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
