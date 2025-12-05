import { NextResponse } from 'next/server'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { createSitemapUrl } from '@/utils/url'

export const revalidate = 300
export const dynamic = 'force-dynamic'

function isoDateOnly(date: string) {
  return (date || '').split('T')[0]
}

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c] as string))
}

export async function GET(_: Request, { params }: { params: { date: string } }) {
  const date = params.date // YYYY-MM-DD
  try {
    const rows = await db.execute(sql`
      select slug, kickoff_iso, league, home_team, away_team, event_id from matches
      where kickoff_iso::date = ${date}::date
      order by kickoff_iso asc`)

    const items = (rows as any).rows as Array<{ slug: string; kickoff_iso: string; event_id?: string | null }>

    const urls = items.map(m => {
      const lastMod = isoDateOnly(m.kickoff_iso)
      const path = m.event_id ? `/m/${m.event_id}-${m.slug}` : `/watch/${m.slug}`
      const base = createSitemapUrl(path)

      // Base match page
      let xml = `  <url>\n    <loc>${xmlEscape(base)}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.8</priority>\n  </url>`

      // Subpages (only for /watch/ URLs)
      if (!m.event_id) {
        xml += `\n  <url>\n    <loc>${xmlEscape(base + '/preview')}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.7</priority>\n  </url>`
        xml += `\n  <url>\n    <loc>${xmlEscape(base + '/stats')}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.6</priority>\n  </url>`
        xml += `\n  <url>\n    <loc>${xmlEscape(base + '/lineups')}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>hourly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      }

      return xml
    }).join('\n')

    const xml = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n${urls}\n</urlset>`
    return new NextResponse(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const fallback = `<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
