import { Metadata } from 'next'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { humanizeSlug } from '@/utils/slug'
import Link from 'next/link'
import { format } from 'date-fns'

export const revalidate = 300 // 5 minutes

type Props = {
    params: Promise<{ slug: string; year: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, year } = await params
    const teamName = humanizeSlug(slug)

    return {
        title: `${teamName} ${year} Season - Fixtures, Results & Stats`,
        description: `Complete ${year} season record for ${teamName}. View all fixtures, results, and match statistics for the ${year} campaign.`,
        alternates: {
            canonical: `/teams/${slug}/season/${year}`
        },
        openGraph: {
            title: `${teamName} ${year} Season - Fixtures & Results`,
            description: `Complete ${year} season record for ${teamName}.`,
            url: `/teams/${slug}/season/${year}`,
        }
    }
}

async function getSeasonMatches(slug: string, year: string) {
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
      AND EXTRACT(YEAR FROM kickoff_iso) = ${year}
      ORDER BY kickoff_iso DESC
    `)
        return (rows as any).rows
    } catch (e) {
        console.error('Error fetching season matches:', e)
        return []
    }
}

export default async function TeamSeasonPage({ params }: Props) {
    const { slug, year } = await params
    const teamName = humanizeSlug(slug)
    const matches = await getSeasonMatches(slug, year)

    const upcoming = matches.filter((m: any) => new Date(m.kickoff_iso) > new Date()).reverse()
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
                    <li><Link href={`/teams/${slug}`} className="hover:text-white">{teamName}</Link></li>
                    <li>/</li>
                    <li className="text-white">{year} Season</li>
                </ol>
            </nav>

            {/* Header */}
            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {teamName} <span className="text-gold-400">{year}</span> Season
                </h1>
                <p className="text-gray-400">
                    Complete match record, fixtures, and results for the {year} campaign.
                </p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-white mb-1">{matches.length}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Matches</div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-green-500 mb-1">
                        {past.filter((m: any) =>
                            (m.home_team.toLowerCase().includes(teamName.toLowerCase()) && (m.home_score || 0) > (m.away_score || 0)) ||
                            (m.away_team.toLowerCase().includes(teamName.toLowerCase()) && (m.away_score || 0) > (m.home_score || 0))
                        ).length}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Wins</div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-gray-300 mb-1">
                        {past.filter((m: any) => m.home_score === m.away_score).length}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Draws</div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="text-3xl font-bold text-red-500 mb-1">
                        {past.filter((m: any) =>
                            (m.home_team.toLowerCase().includes(teamName.toLowerCase()) && (m.home_score || 0) < (m.away_score || 0)) ||
                            (m.away_team.toLowerCase().includes(teamName.toLowerCase()) && (m.away_score || 0) < (m.home_score || 0))
                        ).length}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Losses</div>
                </div>
            </div>

            {/* Matches List */}
            <div className="space-y-8">
                {upcoming.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white border-l-4 border-gold-500 pl-3">Upcoming Fixtures</h2>
                        <div className="space-y-3">
                            {upcoming.map((match: any) => (
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
                                                {format(new Date(match.kickoff_iso), 'MMM d')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 flex-1">
                                            <span className={`font-semibold ${match.away_team.toLowerCase().includes(teamName.toLowerCase()) ? 'text-gold-400' : 'text-white'}`}>
                                                {match.away_team}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {past.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-xl font-bold text-white border-l-4 border-gold-500 pl-3">Results</h2>
                        <div className="space-y-3">
                            {past.map((match: any) => (
                                <Link
                                    key={match.slug}
                                    href={`/watch/${match.slug}`}
                                    className="block bg-black/40 border border-white/10 rounded-xl p-4 hover:border-white/30 transition group"
                                >
                                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 justify-end">
                                            <span className={`font-semibold text-right ${match.home_team.toLowerCase().includes(teamName.toLowerCase()) ? 'text-gold-400' : 'text-white'}`}>
                                                {match.home_team}
                                            </span>
                                        </div>

                                        <div className="flex flex-col items-center px-4 min-w-[120px]">
                                            <span className="text-gray-300 font-bold text-lg bg-white/10 px-3 py-1 rounded">
                                                {match.home_score ?? 0} - {match.away_score ?? 0}
                                            </span>
                                            <span className="text-xs text-gray-500 mt-1">
                                                {format(new Date(match.kickoff_iso), 'MMM d')}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4 flex-1">
                                            <span className={`font-semibold ${match.away_team.toLowerCase().includes(teamName.toLowerCase()) ? 'text-gold-400' : 'text-white'}`}>
                                                {match.away_team}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
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
