import fs from 'node:fs'
import path from 'node:path'

export type Json = any

const SNAPSHOT_ROOT = path.join(process.cwd(), 'data', 'api_snapshots')

export function getLatestSnapshotRoot(): string | null {
  try {
    const entries = fs.readdirSync(SNAPSHOT_ROOT, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
    if (!entries.length) return null
    return path.join(SNAPSHOT_ROOT, entries[entries.length - 1])
  } catch {
    return null
  }
}

export function loadSnapshotJson(relPath: string): Json | null {
  const root = getLatestSnapshotRoot()
  if (!root) return null
  const fullPath = path.join(root, relPath)
  if (!fs.existsSync(fullPath)) return null
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function loadIndex(): Json | null {
  return loadSnapshotJson(path.join('_meta', 'index.json'))
}

export function listEvents(): number[] {
  const idx = loadIndex()
  if (!idx) return []
  const ids = (idx.entities?.events ?? []) as number[]
  return Array.from(new Set(ids))
}

export function tournamentsCatalog(): Array<{ id: number; slug: string; name: string }>{
  const data = loadSnapshotJson('tournaments.json')
  const out: Array<{ id: number; slug: string; name: string }> = []
  const results = data?.data?.results ?? []
  for (const r of results) {
    const e = r?.entity
    if (e?.id && e?.slug) out.push({ id: e.id, slug: e.slug, name: e.name })
  }
  return out
}

export function findTournamentBySlug(slug: string) {
  return tournamentsCatalog().find(t => t.slug === slug)
}

export function eventDetails(eventId: number) {
  return loadSnapshotJson(path.join('events', String(eventId), 'details.json'))
}

export function eventLineups(eventId: number) {
  return loadSnapshotJson(path.join('events', String(eventId), 'lineups.json'))
}

export function eventStatistics(eventId: number) {
  return loadSnapshotJson(path.join('events', String(eventId), 'statistics.json'))
}

export function playerHeatmap(eventId: number, playerId: number) {
  return loadSnapshotJson(path.join('events', String(eventId), 'players', String(playerId), 'heatmap.json'))
}

export function playerEventStats(eventId: number, playerId: number) {
  return loadSnapshotJson(path.join('events', String(eventId), 'players', String(playerId), 'statistics.json'))
}

export function trendingPlayers() {
  return loadSnapshotJson(path.join('trending', 'players.json'))
}

export function listPlayersFromSnapshots(): Array<{ id:number; name:string; slug:string }>{
  const ids = listEvents()
  const map = new Map<number, { id:number; name:string; slug:string }>()
  for (const eid of ids) {
    const lu = eventLineups(eid)
    const pools: any[] = [
      lu?.data?.homeTeam?.players,
      lu?.data?.homeTeam?.substitutes,
      lu?.data?.awayTeam?.players,
      lu?.data?.awayTeam?.substitutes,
    ].filter(Boolean).flat()
    for (const p of pools) {
      const id: number | undefined = p?.player?.id ?? p?.id
      const name: string | undefined = p?.player?.name ?? p?.name
      if (id && name && !map.has(id)) {
        map.set(id, { id, name, slug: slugify(name) })
      }
    }
  }
  return Array.from(map.values()).sort((a,b)=> a.slug.localeCompare(b.slug))
}

export function tournamentStandings(tournamentId: number, seasonId: number) {
  return loadSnapshotJson(path.join('tournaments', String(tournamentId), 'seasons', String(seasonId), 'standings.json'))
}

export function listSeasonsForTournament(tournamentId: number): number[] {
  const root = getLatestSnapshotRoot()
  if (!root) return []
  const base = path.join(root, 'tournaments', String(tournamentId), 'seasons')
  if (!fs.existsSync(base)) return []
  try {
    const entries = fs.readdirSync(base, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => Number(d.name))
      .filter(n => Number.isFinite(n))
    return entries
  } catch {
    return []
  }
}

export function tournamentFeaturedEvents(tournamentId: number) {
  return loadSnapshotJson(path.join('tournaments', String(tournamentId), 'featured_events.json'))
}

export function tournamentVideos(tournamentId: number) {
  return loadSnapshotJson(path.join('tournaments', String(tournamentId), 'videos.json'))
}

export function slugify(input: string): string {
  return (input || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function listTeamsFromSnapshots(): Array<{ id: number; name: string; slug?: string }>{
  const ids = listEvents()
  const seen = new Map<number, { id:number; name:string; slug?:string }>()
  for (const eid of ids) {
    const d = eventDetails(eid)
    const e = d?.data?.event
    const ht = e?.homeTeam
    const at = e?.awayTeam
    if (ht?.id && !seen.has(ht.id)) seen.set(ht.id, { id: ht.id, name: ht.name, slug: ht.slug })
    if (at?.id && !seen.has(at.id)) seen.set(at.id, { id: at.id, name: at.name, slug: at.slug })
  }
  return Array.from(seen.values())
}

export function findTeamBySlug(slug: string) {
  const list = listTeamsFromSnapshots()
  return list.find(t => (t.slug || slugify(t.name)) === slug)
}

export function eventsByTournamentSeason(tournamentId: number, seasonId: number) {
  const ids = listEvents()
  const out: Array<{ id:number; startTimestamp?: number; homeTeam?: any; awayTeam?: any; slug?: string }> = []
  for (const eid of ids) {
    const d = eventDetails(eid)
    const e = d?.data?.event
    if (!e) continue
    if (e?.tournament?.id === tournamentId && e?.season?.id === seasonId) {
      out.push({ id: eid, startTimestamp: e.startTimestamp, homeTeam: e.homeTeam, awayTeam: e.awayTeam, slug: e.slug })
    }
  }
  return out.sort((a,b)=> (a.startTimestamp||0) - (b.startTimestamp||0))
}

export function eventsBetweenTeams(teamAId: number, teamBId: number) {
  const ids = listEvents()
  const out: Array<{ id:number; startTimestamp?: number; homeTeam?: any; awayTeam?: any; slug?: string }> = []
  for (const eid of ids) {
    const d = eventDetails(eid)
    const e = d?.data?.event
    if (!e) continue
    const a = e.homeTeam?.id
    const b = e.awayTeam?.id
    if ((a===teamAId && b===teamBId) || (a===teamBId && b===teamAId)) {
      out.push({ id: eid, startTimestamp: e.startTimestamp, homeTeam: e.homeTeam, awayTeam: e.awayTeam, slug: e.slug })
    }
  }
  return out.sort((a,b)=> (a.startTimestamp||0) - (b.startTimestamp||0))
}

export function eventsForTeam(teamId: number) {
  const ids = listEvents()
  const out: Array<{ id:number; startTimestamp?: number; homeTeam?: any; awayTeam?: any; slug?: string; opponent?: any }> = []
  for (const eid of ids) {
    const d = eventDetails(eid)
    const e = d?.data?.event
    if (!e) continue
    const a = e.homeTeam?.id
    const b = e.awayTeam?.id
    if (a === teamId || b === teamId) {
      out.push({ id: eid, startTimestamp: e.startTimestamp, homeTeam: e.homeTeam, awayTeam: e.awayTeam, slug: e.slug, opponent: a===teamId ? e.awayTeam : e.homeTeam })
    }
  }
  return out.sort((a,b)=> (a.startTimestamp||0) - (b.startTimestamp||0))
}

export function categoriesList(){
  const data = loadSnapshotJson('categories.json')
  return data?.data?.categories ?? []
}

export function liveCategoryCounts(){
  const data = loadSnapshotJson(path.join('live', 'category_counts.json'))
  return data?.data?.categories ?? []
}

export function tournamentsByAlpha2(alpha2: string): Array<{ id:number; slug:string; name:string }>{
  const data = loadSnapshotJson('tournaments.json')
  const out: Array<{ id:number; slug:string; name:string }> = []
  const results = data?.data?.results ?? []
  for (const r of results) {
    const e = r?.entity
    const cat = e?.category
    if (e?.id && e?.slug && e?.name && (cat?.alpha2 || cat?.country?.alpha2)){
      const code = (cat?.alpha2 || cat?.country?.alpha2 || '').toString().toUpperCase()
      if (code === alpha2.toUpperCase()) out.push({ id: e.id, slug: e.slug, name: e.name })
    }
  }
  return out
}

export function eventsOnDate(dateISO: string){
  // dateISO: 'YYYY-MM-DD' (UTC)
  const [y,m,d] = dateISO.split('-').map(Number)
  if (![y,m,d].every(n => Number.isFinite(n))) return [] as Array<{ id:number; slug?:string; startTimestamp?:number; homeTeam?:any; awayTeam?:any }>
  const ids = listEvents()
  const out: Array<{ id:number; slug?:string; startTimestamp?:number; homeTeam?:any; awayTeam?:any }> = []
  for (const eid of ids) {
    const det = eventDetails(eid)
    const e = det?.data?.event
    if (!e?.startTimestamp) continue
    const dt = new Date((e.startTimestamp as number) * 1000)
    if (
      dt.getUTCFullYear() === y &&
      (dt.getUTCMonth()+1) === m &&
      dt.getUTCDate() === d
    ){
      out.push({ id: eid, slug: e.slug, startTimestamp: e.startTimestamp, homeTeam: e.homeTeam, awayTeam: e.awayTeam })
    }
  }
  return out.sort((a,b)=> (a.startTimestamp||0) - (b.startTimestamp||0))
}

export function playersForTeam(teamId: number): Array<{ id:number; name:string; position?: string }>{
  const evs = eventsForTeam(teamId)
  const map = new Map<number, { id:number; name:string; position?:string }>()
  for (const e of evs) {
    const lu = eventLineups(e.id)
    const sides = [] as any[]
    const htId = lu?.data?.homeTeam?.team?.id ?? lu?.data?.homeTeam?.id
    if (htId === teamId) {
      sides.push(...(lu?.data?.homeTeam?.players || []), ...(lu?.data?.homeTeam?.substitutes || []))
    }
    const atId = lu?.data?.awayTeam?.team?.id ?? lu?.data?.awayTeam?.id
    if (atId === teamId) {
      sides.push(...(lu?.data?.awayTeam?.players || []), ...(lu?.data?.awayTeam?.substitutes || []))
    }
    for (const p of sides) {
      const id: number | undefined = p?.player?.id ?? p?.id
      const name: string | undefined = p?.player?.name ?? p?.name
      const pos: string | undefined = p?.player?.position ?? p?.position
      if (id && name && !map.has(id)) map.set(id, { id, name, position: pos })
    }
  }
  return Array.from(map.values()).sort((a,b)=> a.name.localeCompare(b.name))
}

export function playerTransferHistory(playerId: number){
  return loadSnapshotJson(path.join('players', String(playerId), 'transfer_history.json'))
}

// List event IDs where a given player appeared (from snapshot lineups)
export function eventsForPlayer(playerId: number): number[] {
  if (!Number.isFinite(playerId)) return []
  const ids = listEvents()
  const out: number[] = []
  for (const eid of ids) {
    const lu = eventLineups(eid)
    if (!lu) continue
    const pools: any[] = [
      lu?.data?.homeTeam?.players,
      lu?.data?.homeTeam?.substitutes,
      lu?.data?.awayTeam?.players,
      lu?.data?.awayTeam?.substitutes,
      // some APIs use different keys
      lu?.data?.starting_eleven,
    ].filter(Boolean).flat()
    const found = pools.some((p: any) => {
      const id = p?.player_id ?? p?.id ?? p?.player?.id
      return Number(id) === Number(playerId)
    })
    if (found) out.push(eid)
  }
  return out
}
