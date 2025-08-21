import { Suspense } from 'react'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { sql, desc, isNotNull } from 'drizzle-orm'
import { format } from 'date-fns'
import Link from 'next/link'
import Script from 'next/script'
import MetricBeacon from '@/components/MetricBeacon'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Football Match Highlights - Best Goals & Moments | Kick AI of Matches',
  description: 'Watch the best football match highlights, goals, and key moments from Premier League, Champions League, La Liga and more. Premium IPTV streaming with 15,000+ channels in 4K quality.',
  keywords: 'football highlights, match highlights, goals, best moments, Premier League highlights, Champions League highlights, La Liga highlights, IPTV streaming, 4K video',
  openGraph: {
    title: 'Football Match Highlights - Premium IPTV Streaming',
    description: 'Watch the best football highlights and goals from top leagues worldwide. Premium IPTV streaming in 4K quality.',
    type: 'website',
    images: ['/highlights-preview.jpg']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Football Match Highlights - Best Goals & Moments',
    description: 'Watch premium football highlights and goals in stunning 4K quality.'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
}

// Loading component
function HighlightsLoading() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="animate-pulse bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-700/50">
          <div className="aspect-video bg-gray-700"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            <div className="h-6 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded w-2/3"></div>
            <div className="h-10 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

// Match Highlights Component
async function MatchHighlights() {
  try {
    // Get matches that have highlights (scorebat embed)
    const highlightMatches = await db.select()
      .from(matches)
      .where(isNotNull(matches.scorebatEmbed))
      .orderBy(desc(matches.kickoffIso))
      .limit(30)

    if (highlightMatches.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-2xl font-bold text-white mb-2">No Highlights Available</h3>
          <p className="text-gray-400 mb-6">Check back soon for new match highlights!</p>
          <Link
            href="/"
            className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-6 py-3 rounded-lg font-bold hover:from-gold-600 hover:to-gold-700 transition-all"
          >
            Browse Live Matches
          </Link>
        </div>
      )
    }

    // Group highlights by league
    const highlightsByLeague = highlightMatches.reduce((acc, match) => {
      const league = match.league as string
      if (!acc[league]) acc[league] = []
      acc[league].push(match)
      return acc
    }, {} as Record<string, typeof highlightMatches>)

    return (
      <div className="space-y-12">
        {/* Featured Highlights */}
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white border-b border-gold-500/30 pb-3">
            🔥 Featured Highlights
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {highlightMatches.slice(0, 4).map((match) => {
              const kickoff = match.kickoffIso instanceof Date ? match.kickoffIso : new Date(match.kickoffIso as unknown as string)
              const isRecent = Date.now() - kickoff.getTime() < 7 * 24 * 60 * 60 * 1000 // Within 7 days

              return (
                <Link
                  key={match.slug}
                  href={`/watch/${match.slug}`}
                  className="group bg-gradient-to-br from-black-800/50 to-black-900/50 backdrop-blur-lg rounded-2xl overflow-hidden border border-gold-500/20 hover:border-gold-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                >
                  {/* Video Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                    <div className="text-6xl text-white/30">⚽</div>
                    <div className="absolute top-4 left-4 z-20">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {match.league}
                      </span>
                    </div>
                    {isRecent && (
                      <div className="absolute top-4 right-4 z-20">
                        <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                          NEW
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center z-20">
                      <div className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transition-all group-hover:scale-110">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">
                        {match.homeTeam} vs {match.awayTeam}
                      </h3>
                      <div className="text-gray-300 text-sm">
                        {format(kickoff, 'MMM dd, yyyy • h:mm a')}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-lg font-bold text-center text-sm">
                      🎬 Watch Highlights
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Highlights by League */}
        {Object.entries(highlightsByLeague).map(([league, leagueMatches]) => (
          <div key={league} className="space-y-6">
            <h3 className="text-2xl font-bold text-white border-b border-gold-500/30 pb-2">
              🏆 {league} Highlights
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leagueMatches.slice(0, 6).map((match) => {
                const kickoff = match.kickoffIso instanceof Date ? match.kickoffIso : new Date(match.kickoffIso as unknown as string)
                const daysAgo = Math.floor((Date.now() - kickoff.getTime()) / (24 * 60 * 60 * 1000))

                return (
                  <Link
                    key={match.slug}
                    href={`/watch/${match.slug}`}
                    className="group bg-gradient-to-br from-black-800/30 to-black-900/30 backdrop-blur-lg rounded-xl overflow-hidden border border-gray-700/30 hover:border-gold-500/50 transition-all duration-300 hover:scale-105"
                  >
                    {/* Video Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                      <div className="text-4xl text-white/30">⚽</div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-red-600/80 hover:bg-red-600 text-white p-3 rounded-full transition-all group-hover:scale-110">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <span className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                          {daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h4 className="text-lg font-bold text-white mb-1 group-hover:text-gold-400 transition-colors line-clamp-2">
                        {match.homeTeam} vs {match.awayTeam}
                      </h4>
                      <div className="text-gray-400 text-sm mb-3">
                        {format(kickoff, 'MMM dd • h:mm a')}
                      </div>
                      <div className="bg-gradient-to-r from-gold-500/20 to-gold-600/20 text-gold-300 px-3 py-2 rounded-lg font-medium text-center text-sm border border-gold-500/30">
                        🎯 Watch Now
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
    console.error('Error fetching highlights:', error)
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-white mb-2">Unable to Load Highlights</h3>
        <p className="text-gray-400 mb-6">Please try again later or contact support.</p>
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

export default function HighlightsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Football Match Highlights",
    "description": "Watch the best football match highlights, goals, and key moments from top leagues worldwide",
    "url": "https://kickai.matches/highlights",
    "mainEntity": {
      "@type": "VideoObject",
      "name": "Football Match Highlights",
      "description": "Premium football highlights and goals from top leagues",
      "contentUrl": "https://kickai.matches/highlights",
      "thumbnailUrl": "https://kickai.matches/highlights-preview.jpg"
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
          "name": "Highlights",
          "item": "https://kickai.matches/highlights"
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-800 to-black-900">
      <MetricBeacon event="highlights_page_view" />
      
      {/* Structured Data */}
      <Script id="highlights-structured-data" type="application/ld+json">
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
              🎬 Highlights
            </li>
          </ol>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-gold-600/10"></div>
        
        {/* Floating video icons */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-4 h-4 bg-red-500/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-gold-500/30 rounded-full animate-ping animation-delay-1000"></div>
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-red-500/30 rounded-full animate-ping animation-delay-2000"></div>
        </div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
                Football
              </span>
              <br />
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                Match Highlights
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Watch the <span className="text-red-400 font-bold">best goals, saves, and key moments</span> from 
              <span className="text-gold-400 font-bold"> Premier League, Champions League, La Liga</span> and more. 
              <span className="text-gold-400 font-bold">Premium highlights in stunning 4K quality.</span>
            </p>

            {/* CTA Section */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/trial"
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                🎬 Watch Premium Highlights
              </Link>
              <Link
                href="/live"
                className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-8 py-4 rounded-xl font-bold text-lg hover:from-gold-600 hover:to-gold-700 transition-all transform hover:scale-105 shadow-2xl"
              >
                🔴 Watch Live Matches
              </Link>
            </div>

            {/* Video Stats */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2 text-red-400">
                <span className="font-bold">4K Quality</span>
                <span className="text-gray-300">highlights</span>
              </div>
              <div className="flex items-center gap-2 text-gold-400">
                <span className="font-bold">Instant</span>
                <span className="text-gray-300">playback</span>
              </div>
              <div className="flex items-center gap-2 text-red-400">
                <span className="font-bold">All Leagues</span>
                <span className="text-gray-300">covered</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <Suspense fallback={<HighlightsLoading />}>
          <MatchHighlights />
        </Suspense>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-gradient-to-r from-red-600/20 to-gold-600/20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Want Full Match Access?
          </h2>
          <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
            Upgrade to premium IPTV and watch complete matches, not just highlights. 
            Get instant access to 15,000+ live channels in 4K quality!
          </p>
          <Link
            href="/trial"
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-12 py-6 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-red-500/25 inline-flex items-center gap-3"
          >
            🎬 UPGRADE TO PREMIUM
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </Link>
        </div>
      </div>
    </div>
  )
}