import Link from 'next/link'
import { Metadata } from 'next'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'

export const revalidate = 1800 // 30m

function toName(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = toName(params.slug)
  let upcoming = 0
  try {
    const res = await db.execute(sql`
      select count(*) as c from matches
      where lower(regexp_replace(league, '[^a-z0-9]+', '-', 'g')) = ${params.slug}
        and kickoff_iso >= now()
    `)
    upcoming = Number((res as any).rows?.[0]?.c || 0)
  } catch {}
  const desc = upcoming > 0
    ? `Watch ${name} live: ${upcoming} upcoming fixtures, kick-off times, and premium streaming access.`
    : `Watch ${name} live with fixtures, kick-off times, and premium streaming access.`

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const canonicalPath = `/leagues/${params.slug}`
  const ogImg = `${baseUrl}/api/og?league=${encodeURIComponent(name)}`

  return {
    title: `${name} Fixtures, Live Scores & Streams`,
    description: desc,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: `${name} Fixtures, Live Scores & Streams`,
      description: desc,
      url: `${baseUrl}${canonicalPath}`,
      images: [{ url: ogImg, width: 1200, height: 630 }],
      siteName: 'Kick AI Matches'
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} Fixtures, Live Scores & Streams`,
      description: desc,
      images: [ogImg]
    }
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const leagueName = toName(params.slug)

  // Fetch camelCased columns via aliases to avoid snake_case mapping issues from raw SQL
  const res = await db.execute(sql`
    select
      slug,
      home_team as "homeTeam",
      away_team as "awayTeam",
      league,
      kickoff_iso as "kickoffIso",
      status,
      scorebat_embed as "scorebatEmbed"
    from matches
    where (
      lower(regexp_replace(league, '[^a-z0-9]+', '-', 'g')) = ${params.slug}
      or lower(league) = ${params.slug.replace(/-/g, ' ')}
    )
    order by kickoff_iso asc
  `)
  const all: Array<{ slug: string; homeTeam: string; awayTeam: string; league: string | null; kickoffIso: string; status?: string | null; scorebatEmbed?: string | null; }> = (res as any).rows || []

  const now = new Date()
  const upcoming = all.filter(m => new Date(m.kickoffIso) >= now)
  const past = all.filter(m => new Date(m.kickoffIso) < now).slice(-20)

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const trialUrl = process.env.NEXT_PUBLIC_TRIAL_URL || '/trial'
  const pricingUrl = process.env.NEXT_PUBLIC_PRICING_URL || '/pricing'

  // Structured Data: Breadcrumbs + ItemList of upcoming matches
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Leagues', item: `${baseUrl}/leagues` },
      { '@type': 'ListItem', position: 2, name: leagueName, item: `${baseUrl}/leagues/${params.slug}` },
    ],
  }
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: upcoming.slice(0, 10).map((m, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${baseUrl}/watch/${m.slug}`,
      name: `${m.homeTeam} vs ${m.awayTeam}`
    }))
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-br from-gold-500/10 via-black-900 to-red-700/10 p-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">{leagueName}</h1>
          <p className="mt-3 text-gray-300">Live fixtures, results and premium streaming for {leagueName}. Start your free trial and be ready before kick-off.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href={trialUrl} className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-3 font-bold text-black shadow hover:from-gold-600 hover:to-gold-700">Start Free Trial</a>
            <a href={pricingUrl} className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10">See What’s Live</a>
          </div>
          <p className="mt-2 text-xs text-gray-400">Instant access. Cancel anytime.</p>
        </div>
      </section>

      {/* Upcoming */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Upcoming Fixtures</h2>
          <a href={trialUrl} className="text-sm font-semibold text-gold-400 hover:text-gold-300">Watch Now →</a>
        </div>
        <ul className="divide-y divide-gray-800 rounded-xl border border-gold-500/20 bg-black/40">
          {upcoming.map(m => (
            <li key={m.slug} className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-white truncate">{m.homeTeam} vs {m.awayTeam}</div>
                <div className="text-gray-400">{new Date(m.kickoffIso).toLocaleString()} {m.league ? `· ${m.league}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <a className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-500" href={`/watch/${m.slug}`}>Watch</a>
              </div>
            </li>
          ))}
          {upcoming.length === 0 && <li className="p-4 text-sm text-gray-400">No upcoming fixtures found.</li>}
        </ul>
      </section>

      {/* Recent */}
      <section className="space-y-3">
        <h2 className="text-2xl font-bold text-white">Recent Matches</h2>
        <ul className="divide-y divide-gray-800 rounded-xl border border-gold-500/20 bg-black/40">
          {past.map(m => (
            <li key={m.slug} className="p-4 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-semibold text-white truncate">{m.homeTeam} vs {m.awayTeam}</div>
                <div className="text-gray-400">{new Date(m.kickoffIso).toLocaleString()} {m.league ? `· ${m.league}` : ''}</div>
              </div>
              <div className="flex items-center gap-2">
                <a className="px-3 py-1.5 text-sm rounded border border-gray-700 hover:border-gray-600" href={`/watch/${m.slug}`}>Highlights</a>
              </div>
            </li>
          ))}
          {past.length === 0 && <li className="p-4 text-sm text-gray-400">No recent results yet.</li>}
        </ul>
      </section>
    </main>
  )
}
