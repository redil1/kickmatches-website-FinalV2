import 'dotenv/config'
import { sql } from 'drizzle-orm'
import { db } from '../db/client'
import { createEmailUrl } from '../utils/url'

type ScheduledEvent = {
  id?: number | string
  startTimestamp?: number
  status?: { type?: string; code?: number }
  tournament?: { name?: string }
  homeTeam?: { name?: string }
  awayTeam?: { name?: string }
}

const API_BASE = (process.env.API_BASE || 'http://155.117.46.251:8004').replace(/\/$/, '')
const DAYS_AHEAD = Number(process.env.SEED_MATCHES_DAYS_AHEAD || 14)
const SCOREBAT_TIMEOUT_MS = Number(process.env.SCOREBAT_TIMEOUT_MS || 8000)

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

function toSlug(home?: string, away?: string, kickoffIso?: string) {
  const base = `${home || 'tbd'} vs ${away || 'tbd'} ${(kickoffIso || '').substring(0, 10)}`
  return base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function fetchJson(url: string): Promise<any> {
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), 15_000)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'accept': 'application/json' } })
    return await res.json().catch(() => ({}))
  } catch (e) {
    return { error: String(e) }
  } finally {
    clearTimeout(to)
  }
}

async function getScorebatEmbed(home: string, away: string): Promise<string> {
  const ctrl = new AbortController()
  const to = setTimeout(() => ctrl.abort(), SCOREBAT_TIMEOUT_MS)
  try {
    const r = await fetch('https://www.scorebat.com/video-api/v3/', { signal: ctrl.signal })
    const j: any = await r.json().catch(() => ({}))
    const embeds: any[] = j?.response || []
    const h = (home || '').toLowerCase()
    const a = (away || '').toLowerCase()
    const found = embeds.find(e => typeof e?.title === 'string' && e.title.toLowerCase().includes(h) && e.title.toLowerCase().includes(a))
    return found?.embed || ''
  } catch {
    return ''
  } finally {
    clearTimeout(to)
  }
}

async function seedMatches() {
  const today = new Date()
  const all: ScheduledEvent[] = []

  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const url = `${API_BASE}/football/events/scheduled?date=${dateStr}`
    const data = await fetchJson(url)
    const events: ScheduledEvent[] = data?.data?.events || []
    all.push(...events)
    await sleep(100)
  }

  let processed = 0

  for (const ev of all) {
    const statusOk = ev?.status?.type === 'notstarted' || ev?.status?.code === 0 || ev?.status == null
    if (!statusOk) continue

    const home = ev?.homeTeam?.name || 'TBD'
    const away = ev?.awayTeam?.name || 'TBD'
    const league = ev?.tournament?.name || null
    const kickoffIso = ev?.startTimestamp ? new Date(Number(ev.startTimestamp) * 1000).toISOString() : new Date().toISOString()
    const slug = toSlug(home, away, kickoffIso)
    const eventId = String(ev?.id ?? '') || null

    const checkout = process.env.CHECKOUT_URL || 'https://www.iptv.shopping/pricing'
    const trialLink = createEmailUrl('/api/trial/start')

    await db.execute(sql`
      insert into matches (event_id, slug, home_team, away_team, league, kickoff_iso, status, stripe_payment_link, trial_link)
      values (${eventId}, ${slug}, ${home}, ${away}, ${league}, ${kickoffIso}, 'scheduled', ${checkout}, ${trialLink})
      on conflict (slug) do update set
        event_id = excluded.event_id,
        home_team = excluded.home_team,
        away_team = excluded.away_team,
        league = excluded.league,
        kickoff_iso = excluded.kickoff_iso,
        status = excluded.status,
        stripe_payment_link = excluded.stripe_payment_link,
        trial_link = excluded.trial_link
    `)

    const embed = await getScorebatEmbed(home, away)
    if (embed) {
      await db.execute(sql`update matches set scorebat_embed=${embed} where slug=${slug}`)
    }

    processed++
  }

  console.log(`✅ Seeded/updated ${processed} matches`)
}

seedMatches()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ seedMatches failed:', err)
    process.exit(1)
  })
