import { NextResponse } from 'next/server'
import { createSitemapUrl } from '@/utils/url'
import { findTournamentBySlug, listSeasonsForTournament } from '@/utils/snapshots'

export const revalidate = 1800
export const dynamic = 'force-dynamic'

function xmlEscape(s: string) {
  return s.replace(/[<>&'\"]/g, (c) => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;','\'':'&apos;'}[c] || c))
}

export async function GET(_: Request, ctx: { params: { slug: string } }) {
  const t = findTournamentBySlug(ctx.params.slug)
  if (!t) return new NextResponse('Not Found', { status: 404 })
  const seasons = listSeasonsForTournament(t.id)
  const urls = seasons.map((sid: number) => createSitemapUrl(`/leagues/${t.slug}/${sid}/fixtures`))
    .concat(seasons.map((sid: number) => createSitemapUrl(`/leagues/${t.slug}/${sid}/results`)))
    .concat(seasons.map((sid: number) => createSitemapUrl(`/leagues/${t.slug}/${sid}/standings`)))

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u: string) => `  <url>\n    <loc>${xmlEscape(u)}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.6</priority>\n  </url>`)
    .join('\n')}\n</urlset>`
  return new NextResponse(body, { headers: { 'content-type': 'application/xml; charset=utf-8' } })
}
