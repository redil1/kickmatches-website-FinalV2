import { Metadata } from 'next'
import { humanizeSlug } from '@/utils/slug'
import Link from 'next/link'

export const revalidate = 300 // 5 minutes

type Props = {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params
    const leagueName = humanizeSlug(slug)
    const year = new Date().getFullYear()

    return {
        title: `${leagueName} Table & Standings ${year} | KickAI Matches`,
        description: `Current ${leagueName} table, standings, and points. Track your team's position and qualification spots.`,
        alternates: {
            canonical: `/leagues/${slug}/standings`
        },
        openGraph: {
            title: `${leagueName} Table & Standings ${year}`,
            description: `Current ${leagueName} table and standings.`,
            url: `/leagues/${slug}/standings`,
        }
    }
}

export default async function LeagueStandingsPage({ params }: Props) {
    const { slug } = await params
    const leagueName = humanizeSlug(slug)

    return (
        <main className="max-w-7xl mx-auto px-4 py-10 space-y-8">
            {/* Breadcrumbs */}
            <nav className="text-sm text-gray-400">
                <ol className="flex items-center space-x-2">
                    <li><Link href="/" className="hover:text-white">Home</Link></li>
                    <li>/</li>
                    <li><Link href="/leagues" className="hover:text-white">Leagues</Link></li>
                    <li>/</li>
                    <li><Link href={`/leagues/${slug}`} className="hover:text-white">{leagueName}</Link></li>
                    <li>/</li>
                    <li className="text-white">Standings</li>
                </ol>
            </nav>

            {/* Header */}
            <div className="border-b border-white/10 pb-6">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    {leagueName} Standings
                </h1>
                <p className="text-gray-400">
                    Current league table and standings for {leagueName}.
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-4 border-b border-white/10 overflow-x-auto pb-1">
                <Link
                    href={`/leagues/${slug}`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Overview
                </Link>
                <Link
                    href={`/leagues/${slug}/fixtures`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Fixtures
                </Link>
                <Link
                    href={`/leagues/${slug}/results`}
                    className="px-4 py-2 text-gray-400 hover:text-white whitespace-nowrap"
                >
                    Results
                </Link>
                <Link
                    href={`/leagues/${slug}/standings`}
                    className="px-4 py-2 text-gold-400 border-b-2 border-gold-400 font-medium whitespace-nowrap"
                >
                    Standings
                </Link>
            </div>

            {/* Standings Placeholder (since we don't have standings data yet) */}
            <div className="bg-black/40 border border-white/10 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-bold text-white mb-2">Standings Coming Soon</h3>
                <p className="text-gray-400 mb-6">
                    We are currently integrating live standings data for {leagueName}.
                    Check back soon for real-time updates!
                </p>
                <div className="flex justify-center gap-4">
                    <Link
                        href={`/leagues/${slug}/fixtures`}
                        className="text-gold-400 hover:underline"
                    >
                        View Fixtures
                    </Link>
                    <span className="text-gray-600">|</span>
                    <Link
                        href={`/leagues/${slug}/results`}
                        className="text-gold-400 hover:underline"
                    >
                        View Results
                    </Link>
                </div>
            </div>

            {/* CTA */}
            <div className="mt-12 bg-gradient-to-r from-gold-500/10 to-red-600/10 rounded-2xl p-8 text-center border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">Watch {leagueName} Live</h2>
                <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                    Don't just check the table - watch every match live in 4K quality.
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
