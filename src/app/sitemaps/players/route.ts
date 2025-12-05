import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&'\"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case '"':
        return '&quot;'
      case '\'':
        return '&apos;'
      default:
        return c
    }
  })
}

export async function GET(request: Request) {
  try {
    const host = request.headers.get('host') || undefined
    const urls: string[] = []

    // Add A-Z index pages as sub-sitemaps
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    alphabet.forEach(letter => {
      urls.push(createSitemapUrl(`/sitemaps/players/${letter}`, host))
    })

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <sitemap>\n    <loc>${xmlEscape(u)}</loc>\n    <lastmod>${new Date().toISOString()}</lastmod>\n  </sitemap>`).join('\n')}\n</sitemapindex>`

    return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  } catch (e) {
    const host = request.headers.get('host') || undefined
    // Fallback to just returning the main players page as a sitemap if something fails
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${xmlEscape(createSitemapUrl('/players', host))}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n</urlset>`
    return new NextResponse(fallback, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
  }
}
