import { Suspense } from 'react'
import { pool } from '@/db/client'
import { format } from 'date-fns'
import Link from 'next/link'
import Script from 'next/script'
import MetricBeacon from '@/components/MetricBeacon'
import type { Metadata } from 'next'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Upcoming Football Matches | Premier League, Champions League Schedule | Live IPTV",
  description: "Never miss a match! View upcoming football fixtures from Premier League, Champions League, La Liga. Free 12-hour IPTV trial with 4K streaming quality.",
  keywords: "upcoming football matches, football fixtures, Premier League schedule, Champions League upcoming, La Liga fixtures, football calendar, live IPTV trial, 4K sports streaming",
  openGraph: {
    title: "Upcoming Football Matches | Premier League, Champions League Schedule",
    description: "Never miss a match! View upcoming football fixtures from top leagues. Free 12-hour IPTV trial with 4K streaming quality.",
    type: "website",
    url: "https://kickaiofmatches.com/upcoming",
    images: [
      {
        url: "/upcoming-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Upcoming Football Matches - Premier League & Champions League Schedule",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Upcoming Football Matches | Premier League, Champions League Schedule",
    description: "Never miss a match! View upcoming football fixtures from top leagues. Free 12-hour IPTV trial.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

// Loading component
function MatchesLoading() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <div className="h-4 bg-gray-700 rounded mb-3 w-1/3"></div>
          <div className="h-6 bg-gray-700 rounded mb-2"></div>
          <div className="h-4 bg-gray-700 rounded mb-4 w-1/2"></div>
          <div className="h-6 bg-gray-700 rounded mb-2"></div>
          <div className="h-10 bg-gray-700 rounded"></div>
        </div>
      ))}
    </div>
  )
}

// Upcoming Matches Component
async function UpcomingMatches() {
  try {
    // Use raw SQL query since Drizzle ORM is having issues
    const result = await pool.query(`
      SELECT id, slug, home_team, away_team, league, kickoff_iso, status, stripe_payment_link, trial_link, scorebat_embed
      FROM matches 
      WHERE kickoff_iso > NOW() 
      ORDER BY kickoff_iso ASC 
      LIMIT 50
    `)

    const upcomingMatches = result.rows.map(row => ({
      id: row.id,
      slug: row.slug,
      homeTeam: row.home_team,
      awayTeam: row.away_team,
      league: row.league,
      kickoffIso: row.kickoff_iso,
      status: row.status,
      stripePaymentLink: row.stripe_payment_link,
      trialLink: row.trial_link,
      scorebatEmbed: row.scorebat_embed
    }))

    if (upcomingMatches.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Upcoming Matches</h3>
          <p className="text-gray-400 mb-6">Check back soon for new fixtures!</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-6 py-3 rounded-lg font-bold hover:from-gold-600 hover:to-gold-700 transition-all"
          >
            Browse Featured Matches
          </Link>
        </div>
      )
    }

    // Group matches by date
    const matchesByDate = upcomingMatches.reduce((acc, match) => {
      const matchDate = new Date(match.kickoffIso)
      const dateKey = matchDate.toDateString()
      if (!acc[dateKey]) acc[dateKey] = { date: matchDate, matches: [] }
      acc[dateKey].matches.push(match)
      return acc
    }, {} as Record<string, { date: Date; matches: typeof upcomingMatches }>)

    return (
      <div className="space-y-8">
        {Object.entries(matchesByDate).map(([dateKey, { date, matches: dayMatches }]) => (
          <div key={dateKey} className="space-y-4">
            <h3 className="text-2xl font-bold text-white border-b border-gold-500/30 pb-2">
              📅 {format(date, 'EEEE, MMMM do, yyyy')}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dayMatches.map((match) => {
                const kickoff = new Date(match.kickoffIso)
                const timeToKickoff = kickoff.getTime() - new Date().getTime()
                const hoursToKickoff = Math.floor(timeToKickoff / (1000 * 60 * 60))
                const isToday = new Date().toDateString() === kickoff.toDateString()
                const isTomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString() === kickoff.toDateString()

                return (
                  <Link
                    key={match.slug}
                    href={`/watch/${match.slug}`}
                    className="group bg-gradient-to-br from-black-800/50 to-black-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gold-500/20 hover:border-gold-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {match.league}
                      </span>
                      {isToday && (
                        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                          TODAY
                        </span>
                      )}
                      {isTomorrow && (
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                          TOMORROW
                        </span>
                      )}
                    </div>

                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">
                        {match.homeTeam}
                      </h4>
                      <div className="text-2xl font-black text-gray-400 my-2">VS</div>
                      <h4 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
                        {match.awayTeam}
                      </h4>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="text-gold-400 font-bold">
                        {format(kickoff, 'h:mm a')}
                      </div>
                      <div className="text-gray-300 text-sm">
                        {format(kickoff, 'MMM dd, yyyy')}
                      </div>
                      {hoursToKickoff > 0 && hoursToKickoff < 48 && (
                        <div className="text-green-400 text-sm font-medium">
                          ⏰ In {hoursToKickoff}h
                        </div>
                      )}
                      <div className="mt-3 bg-gradient-to-r from-gold-500 to-gold-600 text-black px-4 py-2 rounded-lg font-bold text-sm">
                        🎯 Set Reminder
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  } catch (error) {
    console.error('Error fetching upcoming matches:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown',
      cause: error instanceof Error ? error.cause : 'No cause'
    })

    // Test basic database connectivity
    try {
      const testQuery = await pool.query('SELECT 1 as test')
      console.log('Database connectivity test passed:', testQuery.rows)
    } catch (dbError) {
      console.error('Database connectivity test failed:', dbError)
    }

    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-white mb-2">Unable to Load Matches</h3>
        <p className="text-gray-400 mb-6">Please try again later or contact support.</p>
        <div className="text-red-400 text-sm mb-4 font-mono bg-black/50 p-4 rounded-lg max-w-2xl mx-auto">
          Error: {error instanceof Error ? error.message : 'Unknown database error'}
        </div>
        <Link
          href="/"
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-6 py-3 rounded-lg font-bold hover:from-gold-600 hover:to-gold-700 transition-all"
        >
          Go to Homepage
        </Link>
      </div>
    )
  }
}

export default function UpcomingPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Upcoming Football Matches",
    "description": "Browse upcoming football matches and fixtures from top leagues worldwide",
    "url": "https://kickai.matches/upcoming",
    "mainEntity": {
      "@type": "SportsEvent",
      "name": "Upcoming Football Matches",
      "description": "Live streaming schedule for upcoming football matches",
      "sport": "Football"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://kickai.matches"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Upcoming Matches",
          "item": "https://kickai.matches/upcoming"
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-800 to-black-900">
      <MetricBeacon event="upcoming_page_view" />

      {/* Structured Data */}
      <Script id="upcoming-structured-data" type="application/ld+json">
        {JSON.stringify(structuredData)}
      </Script>

      {/* Breadcrumb Navigation */}
      <nav className="bg-black/20 backdrop-blur-sm border-b border-white/10" aria-label="Breadcrumb">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <ol className="flex items-center space-x-2 text-sm">
            <li>
              <Link href="/" className="text-gray-300 hover:text-white transition-colors">
                🏠 Home
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-white font-medium" aria-current="page">
              ⏰ Upcoming Matches
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-red-600/10"></div>

        <div className="relative mx-auto max-w-7xl px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                Upcoming
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                Football Matches
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Never miss a match! Browse upcoming fixtures from <span className="text-gold-400 font-bold">Premier League, Champions League, La Liga</span> and more.
              <span className="text-gold-400 font-bold">Set reminders and get instant access</span> to premium IPTV streaming.
            </p>

            {/* CTA Section */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="https://www.iptv.shopping/pricing"
                className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-8 py-4 rounded-xl font-bold text-lg hover:from-gold-600 hover:to-gold-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                Get premium access instantly
              </Link>
              <Link
                href="/live"
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                🔴 Watch Live Now
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-gold-400">
                <span className="font-bold">15,000+</span>
                <span className="text-gray-300">live channels</span>
              </div>
              <div className="flex items-center gap-2 text-gold-400">
                <span className="font-bold">4K Quality</span>
                <span className="text-gray-300">streaming</span>
              </div>
              <div className="flex items-center gap-2 text-gold-400">
                <span className="font-bold">Instant</span>
                <span className="text-gray-300">activation</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Matches Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Suspense fallback={<MatchesLoading />}>
          <UpcomingMatches />
        </Suspense>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-gradient-to-r from-gold-600/20 to-red-600/20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Watch Every Match?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Get instant access to all upcoming matches with our premium IPTV service.
            Real-time credentials delivered within 15 seconds!
          </p>
          <Link
            href="https://www.iptv.shopping/pricing"
            className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-12 py-6 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-gold-500/25 inline-flex items-center gap-3"
          >
            ⚡ GET INSTANT ACCESS NOW
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}