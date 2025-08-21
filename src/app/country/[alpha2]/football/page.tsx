import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { categoriesList, tournamentsByAlpha2 } from '@/utils/snapshots'

export const revalidate = 1800

export async function generateMetadata({ params }: { params: { alpha2: string } }): Promise<Metadata> {
  const alpha2 = params.alpha2.toUpperCase()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const canonical = `/country/${alpha2}/football`
  return {
    title: `${alpha2} Football Leagues & Fixtures` ,
    description: `Browse ${alpha2} football leagues, fixtures, and match pages. Find tournaments and upcoming matches.`,
    alternates: { canonical },
    openGraph: {
      title: `${alpha2} Football` ,
      description: `Leagues and fixtures for ${alpha2}.`,
      url: `${baseUrl}${canonical}`,
      type: 'website'
    }
  }
}

export default function CountryFootballPage({ params }: { params: { alpha2: string } }) {
  const alpha2 = params.alpha2.toUpperCase()
  const cats = categoriesList()
  const cat = cats.find((c: any) => (c.alpha2 || c.country?.alpha2 || '').toUpperCase() === alpha2)
  if (!cat) return notFound()
  const leagues = tournamentsByAlpha2(alpha2)
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Countries', item: `${base}/sitemaps/country` },
      { '@type': 'ListItem', position: 2, name: `${cat.name} Football`, item: `${base}/country/${alpha2}/football` },
    ],
  }
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: 'How do I find league fixtures?', acceptedAnswer: { '@type': 'Answer', text: 'Open a league page to see fixtures and match links.' } },
      { '@type': 'Question', name: 'Can I watch matches live?', acceptedAnswer: { '@type': 'Answer', text: 'Use the Watch or Trial links on match pages for access.' } }
    ]
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
  <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <header>
        <h1 className="text-3xl font-bold text-white">{cat.name} Football</h1>
        <p className="text-gray-400">Leagues and live football coverage</p>
      </header>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-white">Leagues</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {leagues.map(l => (
            <li key={l.id}>
              <Link className="text-gold-400 hover:underline" href={`/leagues/${l.slug}`}>{l.name}</Link>
            </li>
          ))}
          {leagues.length === 0 && <li className="text-gray-400">No leagues found.</li>}
        </ul>
        <div className="text-sm text-gray-400">
          Explore: <Link className="hover:underline" href={`/matches`}>Matches</Link> · <Link className="hover:underline" href={`/leagues`}>Leagues</Link> · <Link className="hover:underline" href={`/teams`}>Teams</Link>
        </div>
      </section>
    </div>
  )
}
