import fs from 'node:fs'
import path from 'node:path'

type Json = any

const API_BASE = (process.env.API_BASE || 'http://155.117.46.251:8004').replace(/\/$/, '')
const REQUEST_TIMEOUT = Number(process.env.REQUEST_TIMEOUT || 20_000)
const MAX_EVENTS = Number(process.env.MAX_EVENTS || 6)
const MAX_PLAYERS_PER_EVENT = Number(process.env.MAX_PLAYERS_PER_EVENT || 6)
const SLEEP_MS = Number(process.env.SLEEP_MS || 200)

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

function nowTs() {
  const d = new Date()
  return d.toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z')
}

function outRoot(ts: string) {
  return path.join(process.cwd(), 'data', 'api_snapshots', ts)
}

function saveJson(root: string, rel: string, data: Json) {
  const full = path.join(root, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf-8')
  return full
}

async function jget(url: string, params?: Record<string, any>): Promise<Json> {
  const u = new URL(url)
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, String(v)))
  const ac = new AbortController()
  const to = setTimeout(() => ac.abort(), REQUEST_TIMEOUT)
  try {
    const res = await fetch(u.toString(), { signal: ac.signal, headers: { 'accept': 'application/json' } })
    const txt = await res.text()
    try { return JSON.parse(txt) } catch { return { raw: txt, status: res.status } }
  } catch (e: any) {
    return { error: String(e), url: u.toString(), params }
  } finally {
    clearTimeout(to)
    if (SLEEP_MS) await sleep(SLEEP_MS)
  }
}

function extractPlayersFromLineups(lineups: Json): number[] {
  const ids: number[] = []
  try {
    for (const sideKey of ['home_team', 'away_team', 'homeTeam', 'awayTeam']) {
      const team = (lineups?.data || {})[sideKey] || {}
      for (const key of ['starting_eleven', 'players', 'substitutes']) {
        const arr = (team?.[key] || []) as any[]
        for (const p of arr) {
          const id = p?.player_id ?? p?.id ?? p?.player?.id
          if (id) ids.push(Number(id))
        }
      }
    }
  } catch { }
  // dedupe and clamp
  const seen = new Set<number>()
  const out: number[] = []
  for (const id of ids) {
    if (!seen.has(id)) { seen.add(id); out.push(id) }
  }
  return out.slice(0, MAX_PLAYERS_PER_EVENT)
}

export async function runSnapshot(): Promise<{ root: string; indexPath: string }> {
  const ts = nowTs()
  const root = outRoot(ts)
  const index: any = {
    api_base: API_BASE,
    run_ts: ts,
    endpoints: {},
    entities: { events: [] as number[], players: [] as number[], tournaments: [] as number[], seasons: [] as number[] }
  }

  const record = (endpoint: string, file: string, note?: string) => {
    const arr = (index.endpoints[endpoint] ||= [])
    arr.push({ file: path.relative(root, file), note })
  }

  // catalogs
  {
    const data = await jget(`${API_BASE}/football/categories`)
    record('/football/categories', saveJson(root, 'categories.json', data))
  }
  {
    const data = await jget(`${API_BASE}/football/tournaments`)
    record('/football/tournaments', saveJson(root, 'tournaments.json', data))
  }

  // events today
  const today = new Date().toISOString().slice(0, 10)
  const scheduled = await jget(`${API_BASE}/football/events/scheduled`, { date: today })
  record('/football/events/scheduled', saveJson(root, `events/scheduled_${today}.json`, scheduled), `date=${today}`)
  const events: any[] = scheduled?.data?.events || []
  const selected = events.slice(0, Math.max(0, MAX_EVENTS))

  for (const e of selected) {
    const eid = Number(e?.id)
    if (!Number.isFinite(eid)) continue
    index.entities.events.push(eid)

    const details = await jget(`${API_BASE}/football/event/details`, { event_id: eid })
    record('/football/event/details', saveJson(root, `events/${eid}/details.json`, details), `event_id=${eid}`)

    const lineups = await jget(`${API_BASE}/football/event/lineups`, { event_id: eid })
    record('/football/event/lineups', saveJson(root, `events/${eid}/lineups.json`, lineups), `event_id=${eid}`)

    const statistics = await jget(`${API_BASE}/football/event/statistics`, { event_id: eid })
    record('/football/event/statistics', saveJson(root, `events/${eid}/statistics.json`, statistics), `event_id=${eid}`)

    // tournament/season ids from details
    try {
      const tId = details?.data?.event?.tournament?.id
      const sId = details?.data?.event?.season?.id
      if (tId) index.entities.tournaments.push(Number(tId))
      if (sId) index.entities.seasons.push(Number(sId))

      // tournament bundle
      if (tId) {
        const standings = sId ? await jget(`${API_BASE}/football/tournament/standings`, { tournament_id: tId, season_id: sId }) : null
        if (standings) record('/football/tournament/standings', saveJson(root, `tournaments/${tId}/seasons/${sId}/standings.json`, standings), `tournament_id=${tId},season_id=${sId}`)
        const featured = await jget(`${API_BASE}/football/tournament/featured-events`, { tournament_id: tId })
        record('/football/tournament/featured-events', saveJson(root, `tournaments/${tId}/featured_events.json`, featured), `tournament_id=${tId}`)
        const videos = await jget(`${API_BASE}/football/tournament/videos`, { tournament_id: tId })
        record('/football/tournament/videos', saveJson(root, `tournaments/${tId}/videos.json`, videos), `tournament_id=${tId}`)
      }
    } catch { }

    // player bundles
    const pids = extractPlayersFromLineups(lineups)
    for (const pid of pids) {
      index.entities.players.push(pid)
      const heatmap = await jget(`${API_BASE}/football/player/heatmap`, { event_id: eid, player_id: pid })
      record('/football/player/heatmap', saveJson(root, `events/${eid}/players/${pid}/heatmap.json`, heatmap), `event_id=${eid},player_id=${pid}`)
      const pstats = await jget(`${API_BASE}/football/event/player/statistics`, { event_id: eid, player_id: pid })
      record('/football/event/player/statistics', saveJson(root, `events/${eid}/players/${pid}/statistics.json`, pstats), `event_id=${eid},player_id=${pid}`)
      const transfers = await jget(`${API_BASE}/football/player/transfer-history`, { player_id: pid })
      record('/football/player/transfer-history', saveJson(root, `players/${pid}/transfer_history.json`, transfers), `player_id=${pid}`)
    }
  }

  // aggregates
  {
    const trending = await jget(`${API_BASE}/football/trending/players`)
    record('/football/trending/players', saveJson(root, 'trending/players.json', trending))
  }
  {
    const live = await jget(`${API_BASE}/football/live/category-counts`)
    record('/football/live/category-counts', saveJson(root, 'live/category_counts.json', live))
  }
  {
    const bysport = await jget(`${API_BASE}/football/events/count-by-sport`)
    record('/football/events/count-by-sport', saveJson(root, 'events/count_by_sport.json', bysport))
  }

  // dedupe entity lists
  for (const k of Object.keys(index.entities)) {
    const arr: number[] = index.entities[k]
    index.entities[k] = Array.from(new Set(arr))
  }

  // save index
  const idx = saveJson(root, '_meta/index.json', index)
  return { root, indexPath: idx }
}

export async function runSnapshotAndRevalidate() {
  const { indexPath } = await runSnapshot()
  try {
    const url = new URL('/api/revalidate', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
    const secret = process.env.REVALIDATE_SECRET
    const calls = [
      { type: 'matchesSitemapIndex' },
      { type: 'rootSitemap' },
    ]
    for (const body of calls) {
      await fetch(url.toString(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ secret, ...body })
      })
    }
  } catch { }
  return indexPath
}

export default { runSnapshot, runSnapshotAndRevalidate }
