import Link from 'next/link'
import type { Metadata } from 'next'
import { eventsOnDate, slugify } from '@/utils/snapshots'

export const revalidate = 1800

export async function generateMetadata({ params }: { params: { yyyy: string; mm: string; dd: string } }): Promise<Metadata> {
  const { yyyy, mm, dd } = params
  const iso = `${yyyy}-${mm}-${dd}`
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const canonical = `/matches/${yyyy}/${mm}/${dd}`
  return {
    title: `Football Matches on ${iso} | Fixtures & Streams`,
    description: `All football fixtures for ${iso}: kickoff times, teams, and quick links to live match pages.`,
    alternates: { canonical },
    openGraph: {
      title: `Football Matches on ${iso}`,
      description: `See all matches on ${iso} with teams and kickoff times.`,
      url: `${baseUrl}${canonical}`,
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title: `Matches on ${iso}`,
      description: 'Daily fixtures overview',
    }
  }
}

export default function MatchesByDatePage({ params }: { params: { yyyy: string; mm: string; dd: string } }) {
  const { yyyy, mm, dd } = params
  const iso = `${yyyy}-${mm}-${dd}`
  const events = eventsOnDate(iso)
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Matches', item: `${base}/matches` },
      { '@type': 'ListItem', position: 2, name: iso, item: `${base}/matches/${yyyy}/${mm}/${dd}` },
    ],
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <h1 className="text-2xl font-bold text-white">Matches on {iso}</h1>
      <ul className="divide-y divide-gray-800 rounded border border-gray-800">
        {events.map(e => (
          <li key={e.id} className="p-3 flex items-center justify-between text-sm">
            <div>{e.homeTeam?.name} vs {e.awayTeam?.name}</div>
            <Link className="text-gold-400 hover:underline" href={`/m/${e.id}-${slugify(`${e.homeTeam?.name||''}-vs-${e.awayTeam?.name||''}`)}`}>Match</Link>
          </li>
        ))}
        {events.length === 0 && <li className="p-3 text-gray-400">No matches for this date.</li>}
      </ul>
      <div className="text-sm text-gray-400">
        Date sitemap: <Link className="hover:underline" href={`/sitemaps/matches/${iso}`}>XML</Link>
      </div>
    </div>
  )
}
