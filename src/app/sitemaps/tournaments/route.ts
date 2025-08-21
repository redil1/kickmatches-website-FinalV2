import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'
import { tournamentsCatalog } from '@/utils/snapshots'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'}[c] as string))
}

export async function GET() {
  const list = tournamentsCatalog()
  const sitemaps = list.map(t => createSitemapUrl(`/sitemaps/tournaments/${t.slug}`))
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemaps.map((loc:string) => `  <sitemap>\n    <loc>${xmlEscape(loc)}</loc>\n  </sitemap>`).join('\n')}\n</sitemapindex>`
  return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
