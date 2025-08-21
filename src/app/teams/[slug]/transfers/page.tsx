import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findTeamBySlug, playersForTeam, playerTransferHistory, slugify } from '@/utils/snapshots'

export const revalidate = 1800

export default function TeamTransfersPage({ params }: { params: { slug: string } }) {
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
      { '@type': 'ListItem', position: 3, name: 'Transfers', item: `${base}/teams/${params.slug}/transfers` },
    ],
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <h1 className="text-2xl font-bold text-white">{team.name} Transfers</h1>
      <nav className="text-sm text-gray-400">
        <Link className="hover:underline" href={`/teams/${params.slug}`}>Overview</Link>
        <span className="mx-2">·</span>
        <Link className="hover:underline" href={`/teams/${params.slug}/players`}>Players</Link>
      </nav>
      <ul className="space-y-3">
        {players.map(p => {
          const hist = playerTransferHistory(p.id)
          const moves = hist?.data?.transfers || []
          return (
            <li key={p.id} className="p-3 rounded border border-gray-800">
              <div className="font-medium text-gold-300">
                <Link className="hover:underline" href={`/players/${slugify(p.name)}-${p.id}`}>{p.name}</Link>
              </div>
              {moves.length === 0 ? (
                <div className="text-gray-500 text-sm">No transfer history.</div>
              ) : (
                <ul className="mt-2 text-sm text-gray-200 space-y-1">
                  {moves.map((m: any, idx: number) => (
                    <li key={idx}>{m?.date || ''}: {m?.fromTeam?.name || '—'} → {m?.toTeam?.name || '—'} {m?.fee ? `(${m.fee})` : ''}</li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
        {players.length === 0 && <li className="text-gray-400">No players discovered from recent lineups.</li>}
      </ul>
    </div>
  )
}
