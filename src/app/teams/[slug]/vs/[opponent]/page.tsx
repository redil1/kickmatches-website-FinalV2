import { Metadata } from 'next'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { humanizeSlug } from '@/utils/slug'
import Link from 'next/link'
import { format } from 'date-fns'

export const revalidate = 300 // 5 minutes

type Props = {
  params: Promise<{ slug: string; opponent: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, opponent } = await params
  const team1 = humanizeSlug(slug)
  const team2 = humanizeSlug(opponent)
  const year = new Date().getFullYear()

  return {
    title: `${team1} vs ${team2} - Head to Head, Stats & Results ${year}`,
    description: `Complete head-to-head history for ${team1} vs ${team2}. View past results, stats, and upcoming fixtures. Watch live streams in 4K.`,
    alternates: {
      canonical: `/teams/${slug}/vs/${opponent}`
    },
    openGraph: {
      title: `${team1} vs ${team2} - Head to Head & Stats`,
      description: `Head-to-head statistics and match history for ${team1} vs ${team2}.`,
      url: `/teams/${slug}/vs/${opponent}`,
    }
  }
}

async function getHeadToHead(slug1: string, slug2: string) {
  const team1 = humanizeSlug(slug1)
  const team2 = humanizeSlug(slug2)

  try {
    const rows = await db.execute(sql`
      SELECT * FROM matches 
      WHERE (
        (lower(home_team) LIKE ${`%${team1.toLowerCase()}%`} AND lower(away_team) LIKE ${`%${team2.toLowerCase()}%`}) OR
        (lower(home_team) LIKE ${`%${team2.toLowerCase()}%`} AND lower(away_team) LIKE ${`%${team1.toLowerCase()}%`})
      )
      ORDER BY kickoff_iso DESC
      LIMIT 20
    `)
    return (rows as any).rows
  } catch (e) {
    console.error('Error fetching H2H:', e)
    return []
  }
}

export default async function TeamVsTeamPage({ params }: Props) {
  const { slug, opponent } = await params
  const team1 = humanizeSlug(slug)
  const team2 = humanizeSlug(opponent)
  const matches = await getHeadToHead(slug, opponent)

  const upcoming = matches.filter((m: any) => new Date(m.kickoff_iso) > new Date())
  const past = matches.filter((m: any) => new Date(m.kickoff_iso) <= new Date())

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-400">
        <ol className="flex items-center space-x-2">
          <li><Link href="/" className="hover:text-white">Home</Link></li>
          <li>/</li>
          <li><Link href="/teams" className="hover:text-white">Teams</Link></li>
          <li>/</li>
          <li><Link href={`/teams/${slug}`} className="hover:text-white">{team1}</Link></li>
          <li>/</li>
          <li className="text-white">vs {team2}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="border-b border-white/10 pb-6 text-center md:text-left">
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          <span className="text-gold-400">{team1}</span> <span className="text-gray-500 text-2xl align-middle mx-2">VS</span> <span className="text-white">{team2}</span>
        </h1>
        <p className="text-gray-400 text-lg">
          Head-to-head statistics, past results, and upcoming fixtures.
        </p>
      </div>

      {/* Stats Summary (if data available) */}
      {matches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="text-4xl font-bold text-white mb-2">{matches.length}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Total Matches</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="text-4xl font-bold text-gold-400 mb-2">{upcoming.length}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Upcoming</div>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-6">
            <div className="text-4xl font-bold text-gray-300 mb-2">{past.length}</div>
            <div className="text-sm text-gray-400 uppercase tracking-wider">Played</div>
          </div>
        </div>
      )}

      {/* Upcoming Matches */}
      {upcoming.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Upcoming Fixtures</h2>
          <div className="space-y-4">
            {upcoming.map((match: any) => (
              <Link
                key={match.slug}
                href={`/watch/${match.slug}`}
                className="block bg-gradient-to-r from-gold-500/10 to-transparent border border-gold-500/30 rounded-xl p-4 hover:border-gold-500 transition group"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <span className="text-white font-bold text-xl text-right">{match.home_team}</span>
                  </div>

                  <div className="flex flex-col items-center px-4 min-w-[140px]">
                    <span className="bg-gold-500 text-black font-bold px-3 py-1 rounded text-sm mb-1">
                      UPCOMING
                    </span>
                    <span className="text-white font-bold text-lg">
                      {format(new Date(match.kickoff_iso), 'HH:mm')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(match.kickoff_iso), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-white font-bold text-xl">{match.away_team}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Past Results */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Head-to-Head History</h2>
        {past.length > 0 ? (
          <div className="space-y-4">
            {past.map((match: any) => (
              <Link
                key={match.slug}
                href={`/watch/${match.slug}`}
                className="block bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/30 transition group"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 justify-end">
                    <span className="text-gray-300 font-medium text-right">{match.home_team}</span>
                  </div>

                  <div className="flex flex-col items-center px-4 min-w-[120px]">
                    <span className="text-gray-500 font-bold text-lg bg-white/5 px-3 py-1 rounded">
                      FT
                    </span>
                    <span className="text-xs text-gray-600 mt-1">
                      {format(new Date(match.kickoff_iso), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-gray-300 font-medium">{match.away_team}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-black/20 rounded-xl border border-white/5">
            <p className="text-gray-400">No recent head-to-head matches found.</p>
          </div>
        )}
      </section>

      {/* CTA */}
      <div className="mt-12 bg-gradient-to-r from-gold-500/10 to-red-600/10 rounded-2xl p-8 text-center border border-white/10">
        <h2 className="text-2xl font-bold text-white mb-4">Watch {team1} vs {team2} Live</h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          Don't miss the next clash between these rivals. Get premium access to watch in 4K.
        </p>
        <Link
          href="https://www.iptv.shopping/pricing"
          className="inline-block bg-gradient-to-r from-gold-500 to-gold-600 text-black font-bold py-3 px-8 rounded-xl hover:scale-105 transition transform"
        >
          Get Premium Access
        </Link>
      </div>
    </main>
  )
}
