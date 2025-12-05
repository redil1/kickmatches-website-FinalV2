import { Metadata } from 'next'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { humanizeSlug } from '@/utils/slug'
import Link from 'next/link'
import { format } from 'date-fns'

export const revalidate = 300 // 5 minutes

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const teamName = humanizeSlug(slug)
    const year = new Date().getFullYear()

    return {
        title: `${teamName} Fixtures & Schedule ${year} | KickAI Matches`,
        description: `View all upcoming ${teamName} fixtures and schedule. Watch live streams, check kick-off times and get premium access.`,
        alternates: {
            canonical: `/teams/${slug}/fixtures`
        },
        openGraph: {
            title: `${teamName} Fixtures & Schedule ${year}`,
            description: `Complete ${teamName} match schedule and live stream links.`,
            url: `/teams/${slug}/fixtures`,
        }
    }
}

async function getFixtures(slug: string) {
    const teamName = humanizeSlug(slug)

    try {
        const rows = await db.execute(sql`
      SELECT * FROM matches 
      WHERE (
        lower(home_team) = ${teamName.toLowerCase()} OR 
        lower(away_team) = ${teamName.toLowerCase()} OR
        lower(home_team) LIKE ${`%${teamName.toLowerCase()}%`} OR
        lower(away_team) LIKE ${`%${teamName.toLowerCase()}%`}
      )
      AND kickoff_iso > NOW()
      ORDER BY kickoff_iso ASC
      LIMIT 50
    `)
        return (rows as any).rows
    } catch (e) {
        console.error('Error fetching fixtures:', e)
        return []
    }
}

export default async function TeamFixturesPage({ params }: Props) {
    const { slug } = await params
    const teamName = humanizeSlug(slug)
    const fixtures = await getFixtures(slug)

    return (
        <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
            {/* Breadcrumbs */}
            <nav className="text-sm text-gray-400">
                <ol className="flex items-center space-x-2">
                    <li><Link href="/" className="hover:text-white">Home</Link></li>
                    <li>/</li>
                    <li><Link href="/teams" className="hover:text-white">Teams</Link></li>
                    <li>/</li>
                    <li><Link href={`/teams/${slug}`} className="hover:text-white">{teamName}</Link></li>
                    <li>/</li>
                    <li className="text-white">Fixtures</li>
                </ol>
            </nav>

            {/* Header */}
            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {teamName} Fixtures
                </h1>
                <p className="text-gray-400">
                    Upcoming matches, schedule, and live stream links for {teamName}.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-white/10 overflow-x-auto pb-1">
                <Link
                    href={`/teams/${slug}`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Overview
                </Link>
                <Link
                    href={`/teams/${slug}/fixtures`}
                    className="px-4 py-2 text-gold-400 border-b-2 border-gold-400 font-medium whitespace-nowrap"
                >
                    Fixtures
                </Link>
                <Link
                    href={`/teams/${slug}/results`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Results
                </Link>
            </div>

            {/* Fixtures List */}
            <div className="space-y-4">
                {fixtures.length > 0 ? (
                    fixtures.map((match: any) => (
                        <Link
                            key={match.slug}
                            href={`/watch/${match.slug}`}
                            className="block bg-black/40 border border-white/10 rounded-xl p-4 hover:border-gold-500/50 transition group"
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1 justify-end">
                                    <span className={`font-semibold text-right ${match.home_team.toLowerCase().includes(teamName.toLowerCase()) ? 'text-gold-400' : 'text-white'}`}>
                                        {match.home_team}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center px-4 min-w-[120px]">
                                    <span className="text-gold-400 font-bold text-lg">
                                        {format(new Date(match.kickoff_iso), 'HH:mm')}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {format(new Date(match.kickoff_iso), 'MMM d, yyyy')}
                                    </span>
                                    <span className="text-[10px] text-gray-600 mt-1 uppercase tracking-wider">
                                        {match.league}
                                    </span>
                                </div>

                                <div className="flex items-center gap-4 flex-1">
                                    <span className={`font-semibold ${match.away_team.toLowerCase().includes(teamName.toLowerCase()) ? 'text-gold-400' : 'text-white'}`}>
                                        {match.away_team}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-12 bg-black/20 rounded-xl border border-white/5">
                        <p className="text-gray-400">No upcoming fixtures found for {teamName}.</p>
                        <Link href="/matches" className="text-gold-400 hover:underline mt-2 inline-block">
                            View all matches
                        </Link>
                    </div>
                )}
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-r from-gold-500/10 to-red-600/10 rounded-2xl p-8 text-center border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">Watch {teamName} Live</h2>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Get instant access to all {teamName} matches in 4K quality. No buffering, no ads.
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
