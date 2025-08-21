import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findTeamBySlug, eventsBetweenTeams } from '@/utils/snapshots'

export const revalidate = 1800

export default function HeadToHeadPage({ params }: { params: { slug: string; opponent: string } }) {
  const a = findTeamBySlug(params.slug)
  const b = findTeamBySlug(params.opponent)
  if (!a || !b) return notFound()
  const events = eventsBetweenTeams(a.id, b.id)
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Teams', item: `${base}/teams` },
      { '@type': 'ListItem', position: 2, name: a.name, item: `${base}/teams/${params.slug}` },
      { '@type': 'ListItem', position: 3, name: `vs ${b.name}`, item: `${base}/teams/${params.slug}/vs/${params.opponent}` },
    ],
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <h1 className="text-2xl font-bold text-white">{a.name} vs {b.name} — Head to Head</h1>
      <nav className="text-sm text-gray-400">
        <Link className="hover:underline" href={`/teams/${params.slug}`}>{a.name} overview</Link>
        <span className="mx-2">·</span>
        <Link className="hover:underline" href={`/teams/${params.opponent}`}>{b.name} overview</Link>
      </nav>
      <ul className="divide-y divide-gray-800 rounded border border-gray-800">
        {events.map(e => (
          <li key={e.id} className="p-3 flex items-center justify-between text-sm">
            <div>{e.homeTeam?.name} vs {e.awayTeam?.name}</div>
            <Link className="text-gold-400 hover:underline" href={`/m/${e.id}-${(e.slug || '').toString()}`}>Match</Link>
          </li>
        ))}
        {events.length === 0 && <li className="p-3 text-gray-400">No meetings found.</li>}
      </ul>
    </div>
  )
}
