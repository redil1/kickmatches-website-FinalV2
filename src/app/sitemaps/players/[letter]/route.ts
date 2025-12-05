import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&'\"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', '\'': '&apos;' }[c] || c))
}

export async function GET(request: Request, { params }: { params: Promise<{ letter: string }> }) {
  try {
    const host = request.headers.get('host') || undefined
    const { letter } = await params

    // Get players starting with this letter
    const res = await db.execute(sql`
      select slug, id 
      from players 
      where lower(left(name, 1)) = lower(${letter})
      order by name
      limit 1000
    `)
    const playersList = (res as any).rows

    const urls = playersList.map((p: any) => createSitemapUrl(`/player/${p.id}-${p.slug}`, host))

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u: string) => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`).join('\n')}\n</urlset>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    const { letter } = await params
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl(`/players/${letter}`, host))}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
