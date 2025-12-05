import { Metadata } from 'next'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import Link from 'next/link'
import { format } from 'date-fns'
import { notFound } from 'next/navigation'

export const revalidate = 300 // 5 minutes

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params

    // Fetch match basic info for metadata
    const rows = await db.execute(sql`SELECT home_team, away_team, kickoff_iso FROM matches WHERE slug = ${slug} LIMIT 1`)
    const match = (rows as any).rows[0]

    if (!match) return { title: 'Match Not Found' }

    const home = match.home_team
    const away = match.away_team
    const year = new Date(match.kickoff_iso).getFullYear()

    return {
        title: `${home} vs ${away} Prediction, Preview & H2H Stats ${year}`,
        description: `Match preview for ${home} vs ${away}. Check head-to-head stats, recent form, and predictions. Watch live stream in 4K.`,
        alternates: {
            canonical: `/watch/${slug}/preview`
        },
        openGraph: {
            title: `${home} vs ${away} - Match Preview & Prediction`,
            description: `Match preview, H2H stats and prediction for ${home} vs ${away}.`,
            url: `/watch/${slug}/preview`,
        }
    }
}

async function getMatchData(slug: string) {
    try {
        // Get main match
        const rows = await db.execute(sql`SELECT * FROM matches WHERE slug = ${slug} LIMIT 1`)
        const match = (rows as any).rows[0]
        if (!match) return null

        // Get H2H
        const h2hRows = await db.execute(sql`
      SELECT * FROM matches 
      WHERE (
        (lower(home_team) LIKE ${`%${match.home_team.toLowerCase()}%`} AND lower(away_team) LIKE ${`%${match.away_team.toLowerCase()}%`}) OR
        (lower(home_team) LIKE ${`%${match.away_team.toLowerCase()}%`} AND lower(away_team) LIKE ${`%${match.home_team.toLowerCase()}%`})
      )
      AND slug != ${slug}
      AND kickoff_iso < NOW()
      ORDER BY kickoff_iso DESC
      LIMIT 5
    `)

        // Get Home Form
        const homeFormRows = await db.execute(sql`
      SELECT * FROM matches 
      WHERE (lower(home_team) = ${match.home_team.toLowerCase()} OR lower(away_team) = ${match.home_team.toLowerCase()})
      AND slug != ${slug}
      AND kickoff_iso < NOW()
      ORDER BY kickoff_iso DESC
      LIMIT 5
    `)

        // Get Away Form
        const awayFormRows = await db.execute(sql`
      SELECT * FROM matches 
      WHERE (lower(home_team) = ${match.away_team.toLowerCase()} OR lower(away_team) = ${match.away_team.toLowerCase()})
      AND slug != ${slug}
      AND kickoff_iso < NOW()
      ORDER BY kickoff_iso DESC
      LIMIT 5
    `)

        return {
            match,
            h2h: (h2hRows as any).rows,
            homeForm: (homeFormRows as any).rows,
            awayForm: (awayFormRows as any).rows
        }
    } catch (e) {
        console.error('Error fetching match data:', e)
        return null
    }
}

export default async function MatchPreviewPage({ params }: Props) {
    const { slug } = await params
    const data = await getMatchData(slug)

    if (!data) notFound()

    const { match, h2h, homeForm, awayForm } = data

    return (
        <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
            {/* Breadcrumbs */}
            <nav className="text-sm text-gray-400">
                <ol className="flex items-center space-x-2">
                    <li><Link href="/" className="hover:text-white">Home</Link></li>
                    <li>/</li>
                    <li><Link href="/matches" className="hover:text-white">Matches</Link></li>
                    <li>/</li>
                    <li className="text-white">Preview</li>
                </ol>
            </nav>

            {/* Match Header */}
            <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent opacity-50"></div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 text-right">
                        <h2 className="text-2xl md:text-4xl font-bold text-white">{match.home_team}</h2>
                    </div>

                    <div className="flex flex-col items-center min-w-[180px]">
                        <div className="text-gold-400 font-bold text-3xl mb-1">
                            {format(new Date(match.kickoff_iso), 'HH:mm')}
                        </div>
                        <div className="text-gray-400 text-sm uppercase tracking-wider mb-4">
                            {format(new Date(match.kickoff_iso), 'MMM d, yyyy')}
                        </div>
                        <Link
                            href={`/watch/${match.slug}`}
                            className="bg-gold-500 hover:bg-gold-400 text-black font-bold py-2 px-6 rounded-full transition transform hover:scale-105"
                        >
                            Watch Live
                        </Link>
                    </div>

                    <div className="flex-1 text-left">
                        <h2 className="text-2xl md:text-4xl font-bold text-white">{match.away_team}</h2>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-white/10 overflow-x-auto pb-1 justify-center">
                <Link
                    href={`/watch/${slug}`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Watch
                </Link>
                <Link
                    href={`/watch/${slug}/preview`}
                    className="px-4 py-2 text-gold-400 border-b-2 border-gold-400 font-medium whitespace-nowrap"
                >
                    Preview
                </Link>
                <Link
                    href={`/watch/${slug}/stats`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Stats
                </Link>
                <Link
                    href={`/watch/${slug}/lineups`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Lineups
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Form */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-l-4 border-gold-500 pl-3">Recent Form</h3>

                    <div className="space-y-4">
                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                            <h4 className="text-white font-semibold mb-3">{match.home_team}</h4>
                            <div className="space-y-2">
                                {homeForm.map((m: any) => (
                                    <div key={m.id} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{format(new Date(m.kickoff_iso), 'dd/MM')}</span>
                                        <span className="text-gray-300 truncate max-w-[150px]">vs {m.home_team === match.home_team ? m.away_team : m.home_team}</span>
                                        <span className={`font-bold ${(m.home_team === match.home_team && (m.home_score || 0) > (m.away_score || 0)) ||
                                                (m.away_team === match.home_team && (m.away_score || 0) > (m.home_score || 0))
                                                ? 'text-green-500'
                                                : (m.home_score === m.away_score ? 'text-gray-400' : 'text-red-500')
                                            }`}>
                                            {m.home_score ?? '-'} - {m.away_score ?? '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                            <h4 className="text-white font-semibold mb-3">{match.away_team}</h4>
                            <div className="space-y-2">
                                {awayForm.map((m: any) => (
                                    <div key={m.id} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{format(new Date(m.kickoff_iso), 'dd/MM')}</span>
                                        <span className="text-gray-300 truncate max-w-[150px]">vs {m.home_team === match.away_team ? m.away_team : m.home_team}</span>
                                        <span className={`font-bold ${(m.home_team === match.away_team && (m.home_score || 0) > (m.away_score || 0)) ||
                                                (m.away_team === match.away_team && (m.away_score || 0) > (m.home_score || 0))
                                                ? 'text-green-500'
                                                : (m.home_score === m.away_score ? 'text-gray-400' : 'text-red-500')
                                            }`}>
                                            {m.home_score ?? '-'} - {m.away_score ?? '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Head to Head */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-l-4 border-gold-500 pl-3">Head to Head</h3>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                        {h2h.length > 0 ? (
                            <div className="space-y-3">
                                {h2h.map((m: any) => (
                                    <Link key={m.id} href={`/watch/${m.slug}`} className="flex items-center justify-between p-2 hover:bg-white/5 rounded transition">
                                        <div className="text-right flex-1 text-gray-300 text-sm">{m.home_team}</div>
                                        <div className="px-4 font-bold text-gold-400 whitespace-nowrap">
                                            {m.home_score ?? '?'} - {m.away_score ?? '?'}
                                        </div>
                                        <div className="text-left flex-1 text-gray-300 text-sm">{m.away_team}</div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-center py-4">No recent head-to-head matches found.</p>
                        )}
                    </div>

                    {/* Prediction Placeholder */}
                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">Match Prediction</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Based on recent form and head-to-head statistics, this match is expected to be competitive.
                            Watch live to see the action unfold!
                        </p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>Probability:</span>
                            <div className="flex gap-2">
                                <span className="text-white">Home 33%</span>
                                <span className="text-white">Draw 34%</span>
                                <span className="text-white">Away 33%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-r from-gold-500/10 to-red-600/10 rounded-2xl p-8 text-center border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">Watch {match.home_team} vs {match.away_team} Live</h2>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Get instant access to this match in 4K quality. No buffering, no ads.
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
