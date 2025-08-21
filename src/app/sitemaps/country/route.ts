import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'
import { categoriesList } from '@/utils/snapshots'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&'\"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'}[c] || c))
}

export async function GET() {
  const cats = categoriesList()
  const urls = cats
    .filter((c: any) => (c.alpha2 || c.country?.alpha2))
    .map((c: any) => createSitemapUrl(`/country/${(c.alpha2 || c.country?.alpha2).toString().toUpperCase()}/football`))

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u: string) => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.5</priority>\n  </url>`)
    .join('\n')}\n</urlset>`
  return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
