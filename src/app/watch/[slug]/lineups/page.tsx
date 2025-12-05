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

    const rows = await db.execute(sql`SELECT home_team, away_team, kickoff_iso FROM matches WHERE slug = ${slug} LIMIT 1`)
    const match = (rows as any).rows[0]

    if (!match) return { title: 'Match Not Found' }

    const home = match.home_team
    const away = match.away_team
    const year = new Date(match.kickoff_iso).getFullYear()

    return {
        title: `${home} vs ${away} Lineups, Formations & Team News ${year}`,
        description: `Confirmed lineups and formations for ${home} vs ${away}. Check starting XI, substitutes, and team news. Watch live stream for pre-match analysis.`,
        alternates: {
            canonical: `/watch/${slug}/lineups`
        },
        openGraph: {
            title: `${home} vs ${away} - Lineups & Team News`,
            description: `Confirmed lineups and team news for ${home} vs ${away}.`,
            url: `/watch/${slug}/lineups`,
        }
    }
}

async function getMatchData(slug: string) {
    try {
        const rows = await db.execute(sql`SELECT * FROM matches WHERE slug = ${slug} LIMIT 1`)
        const match = (rows as any).rows[0]
        return match
    } catch (e) {
        console.error('Error fetching match data:', e)
        return null
    }
}

export default async function MatchLineupsPage({ params }: Props) {
    const { slug } = await params
    const match = await getMatchData(slug)

    if (!match) notFound()

    return (
        <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
            {/* Breadcrumbs */}
            <nav className="text-sm text-gray-400">
                <ol className="flex items-center space-x-2">
                    <li><Link href="/" className="hover:text-white">Home</Link></li>
                    <li>/</li>
                    <li><Link href="/matches" className="hover:text-white">Matches</Link></li>
                    <li>/</li>
                    <li className="text-white">Lineups</li>
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
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
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
                    className="px-4 py-2 text-gold-400 border-b-2 border-gold-400 font-medium whitespace-nowrap"
                >
                    Lineups
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Lineups Placeholder */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-l-4 border-gold-500 pl-3">Starting XI</h3>

                    <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center">
                        <div className="flex justify-center gap-8 mb-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                    👕
                                </div>
                                <div className="font-bold text-white">{match.home_team}</div>
                            </div>
                            <div className="text-center">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-2">
                                    👕
                                </div>
                                <div className="font-bold text-white">{match.away_team}</div>
                            </div>
                        </div>

                        <p className="text-gray-400 mb-4">
                            Confirmed lineups are usually available 60 minutes before kick-off.
                            Check the live stream for the latest team news and formations.
                        </p>
                    </div>
                </div>

                {/* Live Coverage CTA */}
                <div className="space-y-6">
                    <h3 className="text-xl font-bold text-white border-l-4 border-gold-500 pl-3">Live Team News</h3>

                    <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-xl p-8 text-center">
                        <div className="text-5xl mb-4">📺</div>
                        <h3 className="text-xl font-bold text-white mb-2">Watch Pre-Match Analysis</h3>
                        <p className="text-gray-400 mb-6">
                            Get expert analysis on the starting lineups, formations, and key player battles in our pre-match show.
                        </p>
                        <Link
                            href={`/watch/${slug}`}
                            className="inline-block bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-gray-200 transition transform hover:scale-105"
                        >
                            Go to Live Stream
                        </Link>
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
