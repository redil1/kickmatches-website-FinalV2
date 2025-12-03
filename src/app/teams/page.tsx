import { Metadata } from 'next'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { slugify } from '@/utils/slug'
import DirectoryFilter from '@/components/DirectoryFilter'

export const revalidate = 1800

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const sp = await searchParams
  const p = Math.max(1, Number(sp?.page || '1') || 1)
  const canonical = p > 1 ? `/teams?page=${p}` : '/teams'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return {
    title: 'Football Teams - Fixtures & Streams',
    description: 'Browse all teams with live fixtures, results and premium streaming. Start a free trial to unlock premium streams.',
    alternates: { canonical },
    keywords: ['football teams', 'live stream', 'club fixtures', 'watch team live', 'team fixtures'],
    openGraph: {
      title: 'Football Teams - Fixtures & Streams',
      description: 'Browse teams, fixtures and premium streams. Start a free trial to unlock access now.',
      url: `${baseUrl}${canonical}`,
      images: [{ url: `${baseUrl}/api/og?type=teams`, width: 1200, height: 630 }],
      siteName: 'Kick AI Matches'
    }
  }
}

async function getTeams(page: number, pageSize: number) {
  try {
    const offset = (page - 1) * pageSize
    const rows = await db.execute(sql`
      select name from (
        select distinct home_team as name from matches
        union
        select distinct away_team as name from matches
      ) t where name is not null order by name limit ${pageSize} offset ${offset}`)
    const total = await db.execute(sql`
      select count(*) as c from (
        select distinct home_team as name from matches
        union
        select distinct away_team as name from matches
      ) t where name is not null`)
    return { items: (rows as any).rows.map((r: any) => r.name as string), total: Number((total as any).rows?.[0]?.c || 0) }
  } catch (err) {
    console.error('Error loading teams:', err)
    return { items: [], total: 0 }
  }
}

async function getFeaturedTeams(limit: number) {
  try {
    const rows = await db.execute(sql`
      select name, count(*) as c from (
        select home_team as name from matches where kickoff_iso >= now()
        union all
        select away_team as name from matches where kickoff_iso >= now()
      ) t where name is not null
      group by name
      order by c desc nulls last
      limit ${limit}
    `)
    return (rows as any).rows.map((r: any) => ({ name: r.name as string, count: Number(r.c || 0) }))
  } catch (err) {
    console.error('Error loading featured teams:', err)
    return []
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page || '1') || 1)
  const pageSize = 60
  const { items, total } = await getTeams(page, pageSize)
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const featured = await getFeaturedTeams(12)
  const variant = page % 2 === 0 ? 'A' : 'B'
  const trialUrl = process.env.NEXT_PUBLIC_TRIAL_URL || '/trial'
  const pricingUrl = process.env.NEXT_PUBLIC_PRICING_URL || '/pricing'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Teams', item: '/teams' },
    ]
  }

  // Additional SEO structured data for ItemList and FAQ
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((name: string, idx: number) => ({
      '@type': 'ListItem',
      position: (page - 1) * pageSize + idx + 1,
      url: `${baseUrl}/teams/${slugify(name)}`,
      name,
    })),
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I watch my team live?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Open your team page to see fixtures and hit Start Free Trial to unlock premium streams instantly.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do you support highlights and replays?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Recent matches include highlights when available, and premium plans include on-demand access.'
        }
      }
    ]
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* Hero / Conversion (A/B variant) */}
      <section className="relative overflow-hidden rounded-2xl border border-gold-500/20 bg-gradient-to-br from-gold-500/10 via-black-900 to-red-700/10 p-8">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
            Follow Your Team. Never Miss Kick-Off.
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Live fixtures, results and premium streaming for every club. Start your free trial to watch in seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="https://www.iptv.shopping/pricing" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-3 font-bold text-black shadow hover:from-gold-600 hover:to-gold-700">
              Get premium access instantly
            </a>
            <a href={pricingUrl} className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 font-semibold text-white hover:bg-white/10">
              {variant === 'A' ? 'Explore Matches' : 'See What’s Live'}
            </a>
          </div>
          <p className="mt-3 text-xs text-gray-400">{variant === 'A' ? 'No commitment. Cancel anytime.' : 'Instant access. Cancel anytime.'}</p>
        </div>
      </section>

      {/* Featured Teams */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Featured Teams</h2>
          <a href="/trial" className="text-sm font-semibold text-gold-400 hover:text-gold-300">{variant === 'A' ? 'Try Free →' : 'Start Now →'}</a>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {featured.map((t: { name: string; count: number }) => (
            <li key={t.name} className="rounded-xl border border-gold-500/20 bg-black/40 p-4 hover:border-gold-500/40 hover:bg-black/50 transition">
              <a className="block" href={`/teams/${slugify(t.name)}`}>
                <div className="font-semibold text-white truncate">{t.name}</div>
                <div className="mt-1 text-[11px] text-gray-400">{t.count} upcoming</div>
              </a>
            </li>
          ))}
          {featured.length === 0 && <li className="text-gray-400">No featured teams yet.</li>}
        </ul>
      </section>

      {/* Directory with search, thumbnails and prioritized CTAs */}
      <DirectoryFilter items={items} type="team" baseUrl={baseUrl} />

      {/* Pagination */}
      <nav className="flex items-center justify-center gap-2">
        <a className={`px-3 py-1 rounded border border-gray-800 text-sm ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`} href={`/teams?page=${page - 1}`}>Prev</a>
        <span className="text-xs text-gray-400">Page {page} of {pages}</span>
        <a className={`px-3 py-1 rounded border border-gray-800 text-sm ${page >= pages ? 'opacity-50 pointer-events-none' : ''}`} href={`/teams?page=${page + 1}`}>Next</a>
      </nav>

      {/* Conversion Footer */}
      <section className="rounded-2xl border border-gold-500/20 bg-black/40 p-6 text-center">
        <h3 className="text-xl font-bold text-white">Ready to watch?</h3>
        <p className="mt-1 text-gray-300">Start your free trial and unlock premium streams in under a minute.</p>
        <div className="mt-4">
          <a href="https://www.iptv.shopping/pricing" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-gold-500 to-gold-600 px-5 py-3 font-bold text-black shadow hover:from-gold-600 hover:to-gold-700">
            Get premium access instantly
          </a>
        </div>
      </section>
    </main>
  )
}
