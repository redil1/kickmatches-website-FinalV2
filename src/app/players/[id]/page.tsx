import { Metadata } from 'next'
import { eventsForPlayer, eventDetails, playerEventStats, playerHeatmap, playerTransferHistory, slugify } from '@/utils/snapshots'

export const revalidate = 600

function parseIdAndName(seg: string) {
  const m = seg.match(/^(.*?)-(\d+)$/)
  if (m) {
    const nameSlug = m[1]
    const id = Number(m[2])
    return { id, name: nameSlug.replace(/-/g, ' ') }
  }
  const id = Number(seg)
  return { id, name: `Player ${seg}` }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { name } = parseIdAndName(params.id)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const canonical = `/players/${params.id}`
  return {
    title: `${name} | Player Profile, Heatmaps & Recent Ratings`,
    description: `See ${name}'s recent match ratings and heatmap activity from snapshot events.`,
    alternates: { canonical },
    openGraph: { title: `${name} – Player`, description: `Recent ratings and heatmaps for ${name}.`, url: `${baseUrl}${canonical}` },
    twitter: { card: 'summary', title: `${name} – Player` }
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const { id: playerId, name } = parseIdAndName(params.id)
  // Discover events for this player from snapshots
  const playerEvents = eventsForPlayer(playerId).slice(-20) // limit to last 20 for brevity
  const heatmaps: Array<{ eventId: number; data: any }> = []
  const stats: Array<{ eventId: number; data: any; meta?: any }> = []
  for (const eid of playerEvents) {
    const hm = playerHeatmap(eid, playerId)
    const st = playerEventStats(eid, playerId)
    const det = eventDetails(eid)
    const meta = det?.data?.event
    if (hm) heatmaps.push({ eventId: eid, data: hm })
    if (st) stats.push({ eventId: eid, data: st, meta })
  }
  // Aggregate simple metrics (e.g., average rating)
  const ratings = stats.map(s => Number(s.data?.data?.statistics?.rating)).filter(n => Number.isFinite(n)) as number[]
  const avgRating = ratings.length ? (ratings.reduce((a,b)=>a+b,0) / ratings.length).toFixed(2) : null
  const appearances = stats.length
  const transfers = playerTransferHistory(playerId)?.data?.transfers || []
  return (
    <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">{name}</h1>
      <section className="rounded border border-gray-800 p-4">
        <h2 className="font-semibold mb-2">Overview</h2>
        <div className="text-sm text-gray-200 flex gap-4">
          <div>Appearances: <span className="text-white font-medium">{appearances}</span></div>
          <div>Average rating: <span className="text-white font-medium">{avgRating ?? '—'}</span></div>
        </div>
      </section>
      <section className="rounded border border-gray-800 p-4">
        <h2 className="font-semibold mb-2">Match-by-match statistics</h2>
        {stats.length === 0 ? (
          <div className="text-gray-500 text-sm">No snapshots for this player in recent events.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-gray-300">
                <tr>
                  <th className="text-left p-2">Match</th>
                  <th className="text-left p-2">Date</th>
                  <th className="text-left p-2">Minutes</th>
                  <th className="text-left p-2">Goals</th>
                  <th className="text-left p-2">Assists</th>
                  <th className="text-left p-2">Shots</th>
                  <th className="text-left p-2">Passes</th>
                  <th className="text-left p-2">Rating</th>
                  <th className="text-left p-2">Heatmap</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(s => {
                  const e = s.meta
                  const dt = e?.startTimestamp ? new Date(e.startTimestamp * 1000) : null
                  const mins = s.data?.data?.statistics?.minutes_played ?? s.data?.data?.statistics?.minutes
                  const goals = s.data?.data?.statistics?.goals
                  const assists = s.data?.data?.statistics?.assists
                  const shots = s.data?.data?.statistics?.total_shots ?? s.data?.data?.statistics?.shots_total ?? s.data?.data?.statistics?.shots
                  const passes = s.data?.data?.statistics?.accurate_passes ?? s.data?.data?.statistics?.passes_accurate ?? s.data?.data?.statistics?.passes
                  const rating = s.data?.data?.statistics?.rating
                  const hs = slugify(`${e?.homeTeam?.name || 'Home'} vs ${e?.awayTeam?.name || 'Away'}`)
                  return (
                    <tr key={s.eventId} className="border-t border-gray-800">
                      <td className="p-2 whitespace-nowrap">
                        <a className="hover:underline" href={`/m/${s.eventId}-${hs}`}>{e?.homeTeam?.name} vs {e?.awayTeam?.name}</a>
                      </td>
                      <td className="p-2">{dt ? dt.toISOString().slice(0,10) : '—'}</td>
                      <td className="p-2">{mins ?? '—'}</td>
                      <td className="p-2">{goals ?? 0}</td>
                      <td className="p-2">{assists ?? 0}</td>
                      <td className="p-2">{shots ?? 0}</td>
                      <td className="p-2">{passes ?? 0}</td>
                      <td className="p-2">{rating ?? '—'}</td>
                      <td className="p-2"><a className="text-blue-400 hover:underline" href={`/players/${params.id}/heatmaps/${s.eventId}`}>View</a></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="rounded border border-gray-800 p-4">
        <h2 className="font-semibold mb-2">Heatmaps</h2>
        <ul className="text-sm space-y-1">
          {heatmaps.length === 0 && <li className="text-gray-500">No heatmap snapshots.</li>}
          {heatmaps.map(h => (
            <li key={h.eventId}>Event #{h.eventId}: {Array.isArray(h.data?.data?.heatmap) ? `${h.data.data.heatmap.length} points` : '—'}</li>
          ))}
        </ul>
      </section>
      <section className="rounded border border-gray-800 p-4">
        <h2 className="font-semibold mb-2">Transfer history</h2>
        {transfers.length === 0 ? (
          <div className="text-sm text-gray-500">No transfer history available.</div>
        ) : (
          <ul className="text-sm space-y-1">
            {transfers.map((t:any, idx:number) => (
              <li key={idx}>{t?.date || ''}: {t?.fromTeam?.name || '—'} → {t?.toTeam?.name || '—'} {t?.fee ? `(${t.fee})` : ''}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
