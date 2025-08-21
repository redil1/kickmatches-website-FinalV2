import { Metadata } from 'next'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { or, ilike } from 'drizzle-orm'
import { sql } from 'drizzle-orm'

export const revalidate = 1800

function toName(slug: string) {
  return slug
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ')
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const name = toName(params.slug)
  let upcoming = 0
  try {
    const res = await db.execute(sql`select count(*) as c from matches where (home_team ilike ${name} or away_team ilike ${name}) and kickoff_iso >= now()`)
    upcoming = Number((res as any).rows?.[0]?.c || 0)
  } catch {}
  const desc = upcoming > 0
    ? `${name} live: ${upcoming} upcoming fixtures, recent results and premium streaming.`
    : `Next fixtures, recent results and premium streaming for ${name}.`
  return {
    title: `${name} Live Matches, Results & Streams`,
    description: desc,
    alternates: { canonical: `/teams/${params.slug}` },
  }
}

export default async function Page({ params }: { params: { slug: string } }) {
  const team = toName(params.slug)
  const all = await db.select().from(matches).where(or(
    ilike(matches.homeTeam, team),
    ilike(matches.awayTeam, team)
  ))

  const now = new Date()
  const upcoming = all.filter(m => new Date(m.kickoffIso as any) >= now).sort((a,b)=> new Date(a.kickoffIso as any).getTime() - new Date(b.kickoffIso as any).getTime())
  const past = all.filter(m => new Date(m.kickoffIso as any) < now).sort((a,b)=> new Date(b.kickoffIso as any).getTime() - new Date(a.kickoffIso as any).getTime()).slice(0, 20)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportsTeam',
    name: team,
    sport: 'Soccer'
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{team}</h1>
        <p className="text-gray-400 text-sm">Fixtures, results and streaming</p>
      </header>

      <section className="space-y-3">
        <h2 className="font-semibold">Upcoming</h2>
        <ul className="divide-y divide-gray-800 rounded border border-gray-800">
          {upcoming.map(m => (
            <li key={m.slug} className="p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{m.homeTeam} vs {m.awayTeam}</div>
                <div className="text-gray-400">{new Date(m.kickoffIso as any).toLocaleString()} · {m.league}</div>
              </div>
              <a className="px-3 py-1 text-sm rounded bg-emerald-600 hover:bg-emerald-500" href={`/watch/${m.slug}`}>Watch</a>
            </li>
          ))}
          {upcoming.length === 0 && <li className="p-3 text-sm text-gray-400">No upcoming fixtures.</li>}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Recent</h2>
        <ul className="divide-y divide-gray-800 rounded border border-gray-800">
          {past.map(m => (
            <li key={m.slug} className="p-3 flex items-center justify-between">
              <div className="text-sm">
                <div className="font-medium">{m.homeTeam} vs {m.awayTeam}</div>
                <div className="text-gray-400">{new Date(m.kickoffIso as any).toLocaleString()} · {m.league}</div>
              </div>
              <a className="px-3 py-1 text-sm rounded border border-gray-700" href={`/watch/${m.slug}`}>Highlights</a>
            </li>
          ))}
          {past.length === 0 && <li className="p-3 text-sm text-gray-400">No recent matches.</li>}
        </ul>
      </section>
    </main>
  )
}
