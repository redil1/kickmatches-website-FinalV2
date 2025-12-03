export const API_BASE = process.env.API_BASE || 'http://155.117.46.251:8004'
import { cacheWrap } from './cache'

function toUrl(path?: unknown): string {
  // Coerce to string safely and avoid startsWith on undefined
  const p = typeof path === 'string' ? path.trim() : String(path ?? '').trim()
  if (!p) throw new Error('fetchJson: empty or invalid path')
  // Use slice instead of startsWith to avoid prototype reliance
  return p.slice(0, 4) === 'http' ? p : `${API_BASE}${p}`
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  let url: string
  try {
    url = toUrl(path)
  } catch (err) {
    // Lightweight diagnostics to help track bad callers in production logs
    console.error('fetchJson path error', { path, type: typeof path, message: (err as any)?.message })
    throw err
  }
  const res = await fetch(url, {
    // Force server-side fetch with short caching where safe
    // Individual pages can override next options
    headers: {
      'accept': 'application/json',
      'user-agent': 'kickmatches-app/1.0',
    },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${url} failed: ${res.status} ${res.statusText} ${text}`)
  }
  return res.json() as Promise<T>
}

export type ApiEnvelope<T> = { success: boolean; data: T }

// Endpoints used across pages
export function getScheduledByDate(dateISO: string) {
  const key = `api:scheduled:${dateISO}`
  return cacheWrap(key, 120, () => fetchJson<ApiEnvelope<{ events: any[] }>>(`/football/events/scheduled?date=${dateISO}`))
}

export function getEventDetails(eventId: string | number) {
  const key = `api:event:details:${eventId}`
  return cacheWrap(key, 60, () => fetchJson<ApiEnvelope<{ event: any }>>(`/football/event/details?event_id=${eventId}`))
}

export function getEventLineups(eventId: string | number) {
  const key = `api:event:lineups:${eventId}`
  return cacheWrap(key, 60, () => fetchJson<ApiEnvelope<{ confirmed: boolean; home: any; away: any }>>(`/football/event/lineups?event_id=${eventId}`))
}

export function getEventStatistics(eventId: string | number) {
  const key = `api:event:stats:${eventId}`
  return cacheWrap(key, 60, () => fetchJson<ApiEnvelope<{ statistics: any[] }>>(`/football/event/statistics?event_id=${eventId}`))
}

export function getPlayerStatistics(eventId: string | number, playerId: number) {
  const key = `api:event:playerstats:${eventId}:${playerId}`
  return cacheWrap(key, 60, () => fetchJson<ApiEnvelope<{ statistics: any }>>(`/football/event/player/statistics?event_id=${eventId}&player_id=${playerId}`))
}

export function getTournamentsCatalog() {
  const key = `api:tournaments`
  return cacheWrap(key, 600, () => fetchJson<ApiEnvelope<{ results: any[] }>>('/football/tournaments'))
}

export function getTournamentStandings(tournamentId: number, seasonId: number) {
  const key = `api:tournament:standings:${tournamentId}:${seasonId}`
  return cacheWrap(key, 600, () => fetchJson<ApiEnvelope<{ standings: any[] }>>(`/football/tournament/standings?tournament_id=${tournamentId}&season_id=${seasonId}`))
}

export function getTournamentFeatured(tournamentId: number) {
  const key = `api:tournament:featured:${tournamentId}`
  return cacheWrap(key, 300, () => fetchJson<ApiEnvelope<{ events: any[] }>>(`/football/tournament/featured-events?tournament_id=${tournamentId}`))
}
