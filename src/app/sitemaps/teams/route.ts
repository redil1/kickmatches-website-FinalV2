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
    // Get all teams
    const rows = await db.execute(sql`
      select name from (
        select distinct home_team as name from matches
        union
        select distinct away_team as name from matches
      ) t where name is not null order by name`)
    const teams: string[] = (rows as any).rows.map((r: any) => r.name as string)

    // Get all unique matchups for VS pages
    const matchupsRows = await db.execute(sql`
      select distinct home_team, away_team from matches
    `)
    const matchups = (matchupsRows as any).rows

    const urls = [createSitemapUrl('/teams', host)]
    const currentYear = new Date().getFullYear()

    // Pre-calculate opponents map for O(1) lookup
    const opponentsMap = new Map<string, Set<string>>()
    matchups.forEach((m: any) => {
      if (m.home_team && m.away_team) {
        if (!opponentsMap.has(m.home_team)) opponentsMap.set(m.home_team, new Set())
        if (!opponentsMap.has(m.away_team)) opponentsMap.set(m.away_team, new Set())

        opponentsMap.get(m.home_team)?.add(m.away_team)
        opponentsMap.get(m.away_team)?.add(m.home_team)
      }
    })

    teams.forEach(t => {
      const slug = slugify(t)
      const base = createSitemapUrl(`/teams/${slug}`, host)

      // Basic pages
      urls.push(
        base,
        `${base}/fixtures`,
        `${base}/results`,
        `${base}/squad`
      )
    })

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n')}\n</urlset>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl('/teams', host))}</loc>\n    <changefreq>hourly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
