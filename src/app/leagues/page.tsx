import { Metadata } from 'next'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { slugify, humanizeSlug } from '@/utils/slug'
import DirectoryFilter from '@/components/DirectoryFilter'

export const revalidate = 1800

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const sp = await searchParams
  const p = Math.max(1, Number(sp?.page || '1') || 1)
  const canonical = p > 1 ? `/leagues?page=${p}` : '/leagues'
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return {
    title: 'Football Leagues - Fixtures & Streams',
    description: 'Browse all leagues with live fixtures, results and premium streaming. Start a free trial to unlock premium streams.',
    alternates: { canonical },
    keywords: ['football leagues', 'live stream', 'soccer leagues', 'premier league', 'la liga', 'serie a', 'watch football online'],
    openGraph: {
      title: 'Football Leagues - Fixtures & Streams',
      description: 'Browse leagues, fixtures and premium streams. Start a free trial to unlock access now.',
      url: `${baseUrl}${canonical}`,
      images: [{ url: `${baseUrl}/api/og?type=leagues`, width: 1200, height: 630 }],
      siteName: 'Kick AI Matches'
    }
  }
}

async function getLeagues(page: number, pageSize: number) {
  try {
    const offset = (page - 1) * pageSize
    const rows = await db.execute(sql`select distinct league from matches where league is not null order by league limit ${pageSize} offset ${offset}`)
    const total = await db.execute(sql`select count(distinct league) as c from matches where league is not null`)
    return { items: (rows as any).rows.map((r: any) => r.league as string), total: Number((total as any).rows?.[0]?.c || 0) }
  } catch (err) {
    console.error('Error loading leagues:', err)
    return { items: [], total: 0 }
  }
}

async function getFeaturedLeagues(limit: number) {
  try {
    const rows = await db.execute(sql`
      select league, count(*) as c
      from matches
      where league is not null and kickoff_iso >= now()
      group by league
      order by c desc nulls last
      limit ${limit}
    `)
    return (rows as any).rows.map((r: any) => ({ name: r.league as string, count: Number(r.c || 0), slug: (r.league || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') }))
  } catch (err) {
    console.error('Error loading featured leagues:', err)
    return []
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp?.page || '1') || 1)
  const pageSize = 50
  const { items, total } = await getLeagues(page, pageSize)
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const featured = await getFeaturedLeagues(8)
  const variant = page % 2 === 0 ? 'A' : 'B'
  const trialUrl = process.env.NEXT_PUBLIC_TRIAL_URL || '/trial'
  const pricingUrl = process.env.NEXT_PUBLIC_PRICING_URL || '/pricing'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Leagues', item: '/leagues' },
    ]
  }

  // Additional SEO structured data: ItemList of current page leagues
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: items.map((name: string, idx: number) => ({
      '@type': 'ListItem',
      position: (page - 1) * pageSize + idx + 1,
      url: `${baseUrl}/leagues/${slugify(name)}`,
      name,
    })),
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How can I watch league matches live?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Start a FREE trial to watch premium streams instantly. Pick any league page and follow the Watch or Free Trial button to get access in under 60 seconds.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do you cover major and minor leagues?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. We list fixtures and streams for top competitions like the Premier League, Champions League, La Liga, Serie A, and also secondary divisions.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is there a commitment to try it?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The trial is commitment-free. You can cancel anytime before upgrading to premium.'
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
            Watch Every League. Live and On-Demand.
          </h1>
          <p className="mt-4 text-lg text-gray-300">
            Fixtures, live streams, and results for the top football leagues. Start your free trial and be ready before kick-off.
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

      {/* Featured Leagues */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Featured Leagues</h2>
          <a href="/trial" className="text-sm font-semibold text-gold-400 hover:text-gold-300">{variant === 'A' ? 'Try Free →' : 'Start Now →'}</a>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {featured.map((f: { name: string; count: number; slug?: string }) => (
            <li key={f.name} className="rounded-xl border border-gold-500/20 bg-black/40 p-4 hover:border-gold-500/40 hover:bg-black/50 transition">
              <a className="block" href={`/leagues/${f.slug || slugify(f.name)}`}>
                <div className="font-semibold text-white truncate">{f.name}</div>
                <div className="mt-1 text-[11px] text-gray-400">{f.count} upcoming</div>
              </a>
            </li>
          ))}
          {featured.length === 0 && <li className="text-gray-400">No featured leagues yet.</li>}
        </ul>
      </section>

      {/* Directory with search, thumbnails and prioritized CTAs */}
      <DirectoryFilter items={items} type="league" baseUrl={baseUrl} />

      {/* Pagination */}
      <nav className="flex items-center justify-center gap-2">
        <a className={`px-3 py-1 rounded border border-gray-800 text-sm ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`} href={`/leagues?page=${page - 1}`}>Prev</a>
        <span className="text-xs text-gray-400">Page {page} of {pages}</span>
        <a className={`px-3 py-1 rounded border border-gray-800 text-sm ${page >= pages ? 'opacity-50 pointer-events-none' : ''}`} href={`/leagues?page=${page + 1}`}>Next</a>
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
