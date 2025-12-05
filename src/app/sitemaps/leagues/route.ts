import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { createSitemapUrl } from '@/utils/url'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string))
}

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

export async function GET(request: Request) {
  try {
    const host = request.headers.get('host') || undefined
    const res = await db.execute(sql`select distinct league from matches where league is not null order by league`)
    const leagues: string[] = (res as any).rows.map((r: any) => r.league as string)

    const urls = [createSitemapUrl('/leagues', host)]

    leagues.forEach(l => {
      const slug = slugify(l)
      const base = createSitemapUrl(`/leagues/${slug}`, host)
      urls.push(
        base,
        `${base}/fixtures`,
        `${base}/results`,
        `${base}/standings`
      )
    })

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n')}\n</urlset>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    // Fallback minimal sitemap so build doesn't fail
    const host = request.headers.get('host') || undefined
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl('/leagues', host))}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
