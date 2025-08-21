import { Metadata } from 'next'
import { eventsByTournamentSeason, findTournamentBySlug } from '@/utils/snapshots'

export const revalidate = 600

export async function generateMetadata({ params }: { params: { slug: string; seasonId: string } }): Promise<Metadata> {
  return { title: `${params.slug.replace(/-/g,' ')} ${params.seasonId} Results` }
}

export default async function Page({ params }: { params: { slug: string; seasonId: string } }) {
  const league = findTournamentBySlug(params.slug)
  if (!league) return <main className="max-w-5xl mx-auto px-4 py-6">Not found</main>
  const seasonId = Number(params.seasonId)
  const events = eventsByTournamentSeason(league.id, seasonId)
  const past = events.filter(e => (e.startTimestamp ?? 0) * 1000 < Date.now())
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <h1 className="text-2xl font-bold">{league.name} — {params.seasonId} Results</h1>
      <ul className="divide-y divide-gray-800 rounded border border-gray-800">
        {past.map(e => (
          <li key={e.id} className="p-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{e.homeTeam?.name} vs {e.awayTeam?.name}</div>
              <div className="text-gray-400">{e.startTimestamp ? new Date(e.startTimestamp*1000).toLocaleString() : ''}</div>
            </div>
            <a className="text-sm underline" href={`/m/${e.id}-${(e.slug || '').toLowerCase()}`}>Match</a>
          </li>
        ))}
        {past.length === 0 && <li className="p-3 text-sm text-gray-500">No results in snapshot.</li>}
      </ul>
    </main>
  )
}
