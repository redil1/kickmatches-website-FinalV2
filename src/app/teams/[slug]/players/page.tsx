import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findTeamBySlug, playersForTeam, slugify } from '@/utils/snapshots'

export const revalidate = 1800

export default function TeamPlayersPage({ params }: { params: { slug: string } }) {
  const team = findTeamBySlug(params.slug)
  if (!team) return notFound()
  const players = playersForTeam(team.id)
  const base = process.env.NEXT_PUBLIC_SITE_URL || ''
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Teams', item: `${base}/teams` },
      { '@type': 'ListItem', position: 2, name: team.name, item: `${base}/teams/${params.slug}` },
      { '@type': 'ListItem', position: 3, name: 'Players', item: `${base}/teams/${params.slug}/players` },
    ],
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <h1 className="text-2xl font-bold text-white">{team.name} Players</h1>
      <nav className="text-sm text-gray-400">
        <Link className="hover:underline" href={`/teams/${params.slug}`}>Overview</Link>
        <span className="mx-2">·</span>
        <Link className="hover:underline" href={`/teams/${params.slug}/transfers`}>Transfers</Link>
      </nav>
      <ul className="grid sm:grid-cols-2 gap-2">
        {players.map(p => (
          <li key={p.id} className="text-sm text-gray-200">
            <Link className="text-gold-400 hover:underline" href={`/players/${slugify(p.name)}-${p.id}`}>{p.name}</Link>
            {p.position && <span className="text-gray-500"> — {p.position}</span>}
          </li>
        ))}
        {players.length === 0 && <li className="text-gray-400">No players discovered from recent lineups.</li>}
      </ul>
    </div>
  )
}
