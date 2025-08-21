import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Flexible revalidation API supporting multiple page types
// Body examples:
// { secret, path: '/any/path' }
// { secret, type: 'watch', slug: 'arsenal-vs-chelsea' }
// { secret, type: 'league', slug: 'premier-league' }
// { secret, type: 'team', slug: 'arsenal' }
// { secret, type: 'leaguesIndex', page: 3 }
// { secret, type: 'teamsIndex', page: 2 }
// { secret, type: 'matchesDateSitemap', date: '2025-08-20' }
// { secret, type: 'matchesSitemapIndex' }
// { secret, type: 'leaguesSitemap' }
// { secret, type: 'teamsSitemap' }
// { secret, type: 'rootSitemap' }
export async function POST(req: NextRequest) {
  let body: any = {}
  try {
    body = await req.json()
  } catch {}

  const { secret, path, type, slug, page, date } = body || {}

  if (secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const targets = new Set<string>()
  const push = (p?: string) => { if (p) targets.add(p) }

  // Direct path
  push(path)

  // Known page types
  switch (type) {
    case 'watch':
      if (slug) push(`/watch/${slug}`)
      break
    case 'league':
      if (slug) push(`/leagues/${slug}`)
      break
    case 'team':
      if (slug) push(`/teams/${slug}`)
      break
    case 'leaguesIndex':
      // Query params are ignored by revalidatePath; base path is sufficient
      push('/leagues')
      break
    case 'teamsIndex':
      push('/teams')
      break
    case 'matchesDateSitemap':
      if (date) push(`/sitemaps/matches/${date}`)
      break
    case 'matchesSitemapIndex':
      push('/sitemaps/matches')
      break
    case 'leaguesSitemap':
      push('/sitemaps/leagues')
      break
    case 'teamsSitemap':
      push('/sitemaps/teams')
      break
    case 'rootSitemap':
      push('/sitemap.xml')
      break
  }

  try {
    targets.forEach((p) => revalidatePath(p))
    return NextResponse.json({ revalidated: true, paths: Array.from(targets) })
  } catch (e) {
    return NextResponse.json({ revalidated: false, error: String(e), paths: Array.from(targets) }, { status: 500 })
  }
}


