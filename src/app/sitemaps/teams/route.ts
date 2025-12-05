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

export async function GET() {
  try {
    const rows = await db.execute(sql`
      select name from (
        select distinct home_team as name from matches
        union
        select distinct away_team as name from matches
      ) t where name is not null order by name`)
    const teams: string[] = (rows as any).rows.map((r: any) => r.name as string)

    const urls = [createSitemapUrl('/teams')]

    teams.forEach(t => {
      const slug = slugify(t)
      const base = createSitemapUrl(`/teams/${slug}`)
      urls.push(
        base,
        `${base}/fixtures`,
        `${base}/results`
      )
    })

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.5</priority>\n  </url>`).join('\n')}\n</urlset>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl('/teams'))}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.5</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
