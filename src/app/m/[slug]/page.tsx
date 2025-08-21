import { Metadata } from 'next'
import { getEventDetails, getEventLineups, getEventStatistics } from '@/utils/api'
import HeatmapMini from '@/components/HeatmapMini'
import { playerHeatmap, trendingPlayers } from '@/utils/snapshots'

export const revalidate = 30 // live-ish

function toTitle(s?: string) {
  if (!s) return 'Live match details'
  return s.split('-').map(p=> (p?.[0]?.toUpperCase() || '') + p.slice(1)).join(' ')
}

function extractParams(params: any): { eventId: string; slug: string } {
  // With [slug] route, params.slug will be the full slug string
  const fullSlug = params?.slug || ''
  
  // For URL like /m/13342634-fc-trollh-ttan-vs-h-ssleholms-if-2025-08-31
  // fullSlug will be '13342634-fc-trollh-ttan-vs-h-ssleholms-if-2025-08-31'
  const idx = fullSlug.indexOf('-')
  if (idx >= 0) {
    const eventId = fullSlug.slice(0, idx)
    const slug = fullSlug.slice(idx + 1)
    return { eventId, slug }
  } else {
    return { eventId: fullSlug, slug: '' }
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { eventId, slug } = extractParams(params)
  try {
    const det = await getEventDetails(eventId)
    const e = det.data?.event
    const ht = e?.homeTeam?.name || 'Home'
    const at = e?.awayTeam?.name || 'Away'
    const title = `${ht} vs ${at} | Live Score, Lineups & Stream`
    const desc = `Watch ${ht} vs ${at} with live score, confirmed lineups, stats, venue and referee details.`
    return { title, description: desc, alternates: { canonical: `/m/${eventId}-${slug}` } }
  } catch {
    return { title: toTitle(slug), description: 'Live match details' }
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const { eventId } = extractParams(params)

  const [details, lineups, stats] = await Promise.all([
    getEventDetails(eventId).catch(() => ({ data: {} as any })),
    getEventLineups(eventId).catch(() => ({ data: {} as any })),
    getEventStatistics(eventId).catch(() => ({ data: { statistics: [] as any[] } })),
  ])

  const e = details.data?.event || {}
  const ht = e.homeTeam?.name || 'Home'
  const at = e.awayTeam?.name || 'Away'
  const kickoff = e.startTimestamp ? new Date(e.startTimestamp * 1000) : undefined
  const venue = e.homeTeam?.venue?.name || e.awayTeam?.venue?.name
  const venueCity = e.homeTeam?.venue?.city?.name || e.awayTeam?.venue?.city?.name
  const venueCapacity = e.homeTeam?.venue?.capacity || e.awayTeam?.venue?.capacity
  const league = e.tournament?.name
  const season = e.season?.name
  const round = e.roundInfo?.round
  const homeManager = e.homeTeam?.manager?.name
  const awayManager = e.awayTeam?.manager?.name
  const homeTeamColors = e.homeTeam?.teamColors
  const awayTeamColors = e.awayTeam?.teamColors
  const homeFoundation = e.homeTeam?.foundationDateTimestamp ? new Date(e.homeTeam.foundationDateTimestamp * 1000) : null
  const status = e.status?.description || e.status?.type || 'scheduled'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${ht} vs ${at}`,
    startDate: kickoff?.toISOString(),
    location: venue ? { 
      '@type': 'Place', 
      name: venue,
      address: venueCity ? {
        '@type': 'PostalAddress',
        addressLocality: venueCity,
        addressCountry: 'Sweden'
      } : undefined
    } : undefined,
    sport: 'Soccer',
    eventStatus: status,
    competitor: [
      { 
        '@type': 'SportsTeam', 
        name: ht,
        coach: homeManager ? { '@type': 'Person', name: homeManager } : undefined,
        foundingDate: homeFoundation?.getFullYear()?.toString()
      },
      { 
        '@type': 'SportsTeam', 
        name: at,
        coach: awayManager ? { '@type': 'Person', name: awayManager } : undefined
      },
    ],
    organizer: league ? {
      '@type': 'SportsOrganization',
      name: league
    } : undefined,
    description: `Watch ${ht} vs ${at} live. ${league ? `${league} ` : ''}${season ? `${season} ` : ''}${round ? `Round ${round}` : ''}`.trim()
  }

  // Derive starters for mini-heatmaps if we have snapshots
  const startersHome: Array<{ id:number; name:string }> = []
  const startersAway: Array<{ id:number; name:string }> = []
  const homePlayers: any[] = (lineups.data?.home?.players || []).filter((p:any)=>p.role==='starter')
  const awayPlayers: any[] = (lineups.data?.away?.players || []).filter((p:any)=>p.role==='starter')
  for (const p of homePlayers.slice(0,6)) startersHome.push({ id: p.player?.id, name: p.player?.name })
  for (const p of awayPlayers.slice(0,6)) startersAway.push({ id: p.player?.id, name: p.player?.name })

  const trending = trendingPlayers()?.data?.players ?? []

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="space-y-2">
        <h1 className="text-2xl font-bold">{ht} vs {at}</h1>
        <p className="text-sm text-gray-400">{league}{league && ' · '}{kickoff ? kickoff.toLocaleString() : ''}{venue ? ` · ${venue}` : ''}</p>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="inline-block rounded bg-gray-800 px-2 py-1">{status}</span>
          {venueCity && <span>City: {venueCity}</span>}
          {venueCapacity && <span>Capacity: {venueCapacity?.toLocaleString()}</span>}
          {season && <span>Season: {season}</span>}
          {round && <span>Round: {round}</span>}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded border border-gray-800 p-4">
          <h2 className="font-semibold mb-2">Team Information</h2>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                {homeTeamColors && (
                  <div 
                    className="w-4 h-4 rounded-full border" 
                    style={{ backgroundColor: homeTeamColors.primary }}
                  />
                )}
                {ht}
              </h3>
              <div className="text-sm text-gray-400 space-y-1">
                {homeManager && <div>Manager: {homeManager}</div>}
                {homeFoundation && <div>Founded: {homeFoundation.getFullYear()}</div>}
                {e.homeTeam?.venue && (
                  <div>Home Venue: {e.homeTeam.venue.name} ({e.homeTeam.venue.capacity?.toLocaleString()} capacity)</div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                {awayTeamColors && (
                  <div 
                    className="w-4 h-4 rounded-full border" 
                    style={{ backgroundColor: awayTeamColors.primary }}
                  />
                )}
                {at}
              </h3>
              <div className="text-sm text-gray-400 space-y-1">
                {awayManager && <div>Manager: {awayManager}</div>}
                {e.awayTeam?.venue && (
                  <div>Home Venue: {e.awayTeam.venue.name} ({e.awayTeam.venue.capacity?.toLocaleString()} capacity)</div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="rounded border border-gray-800 p-4">
          <h2 className="font-semibold mb-2">Match Information</h2>
          <div className="text-sm text-gray-400 space-y-2">
            {league && <div><span className="text-white">Competition:</span> {league}</div>}
            {season && <div><span className="text-white">Season:</span> {season}</div>}
            {round && <div><span className="text-white">Round:</span> {round}</div>}
            {kickoff && <div><span className="text-white">Kick-off:</span> {kickoff.toLocaleString()}</div>}
            {venue && <div><span className="text-white">Venue:</span> {venue}</div>}
            {venueCity && <div><span className="text-white">City:</span> {venueCity}</div>}
            {venueCapacity && <div><span className="text-white">Capacity:</span> {venueCapacity.toLocaleString()}</div>}
            <div><span className="text-white">Status:</span> {status}</div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded border border-gray-800 p-4">
          <h2 className="font-semibold mb-2">Lineups {lineups.data?.confirmed ? '(Confirmed)' : ''}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-1">{ht}</h3>
              <ul className="text-sm space-y-1">
                {homePlayers.map((p:any)=> (
                  <li key={p.player?.id}>{p.player?.name} {p.shirtNumber ? `#${p.shirtNumber}` : ''} <span className="text-gray-500">{p.position}</span></li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-1">{at}</h3>
              <ul className="text-sm space-y-1">
                {awayPlayers.map((p:any)=> (
                  <li key={p.player?.id}>{p.player?.name} {p.shirtNumber ? `#${p.shirtNumber}` : ''} <span className="text-gray-500">{p.position}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <div className="rounded border border-gray-800 p-4">
          <h2 className="font-semibold mb-2">Statistics</h2>
          <ul className="text-sm space-y-1">
            {(stats.data?.statistics || []).slice(0, 20).map((s:any,idx:number)=> (
              <li key={idx} className="flex justify-between">
                <span>{s.name || s.type || s.groupName}</span>
                <span>{s.home ?? s.homeValue ?? ''} - {s.away ?? s.awayValue ?? ''}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded border border-gray-800 p-4">
        <h2 className="font-semibold mb-2">Starters Heatmaps</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {startersHome.concat(startersAway).slice(0,6).map(p => {
            const heat = playerHeatmap(Number(eventId), p.id)
            const points = heat?.data?.heatmap || []
            return (
              <div key={p.id} className="space-y-1">
                <div className="text-xs text-gray-400">{p.name}</div>
                <HeatmapMini points={points} />
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded border border-gray-800 p-4">
        <h2 className="font-semibold mb-2">Trending Players</h2>
        <div className="grid md:grid-cols-3 gap-3">
          {trending.slice(0, 6).map((t:any, i:number) => (
            <a key={i} className="rounded border border-gray-800 p-3 hover:border-gray-700" href={`/players/${(t.player?.slug || t.player?.name || 'player').toLowerCase().replace(/[^a-z0-9]+/g,'-')}-${t.player?.id}`}>
              <div className="font-medium">{t.player?.name}</div>
              {t.rating != null && <div className="text-xs text-gray-400">Rating: {t.rating}</div>}
            </a>
          ))}
        </div>
      </section>

      <section className="rounded border border-gray-800 p-4">
        <h2 className="font-semibold mb-2">Professional Stream</h2>
        <p className="text-sm text-gray-400 mb-2">Watch legally with premium quality and commentary.</p>
        <div className="flex items-center gap-3">
          <a href="/pricing" className="px-4 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm">Get Premium Access</a>
          <a href="/trial" className="px-4 py-2 rounded border border-gray-700 text-sm">Try Free Trial</a>
        </div>
      </section>
    </main>
  )
}
