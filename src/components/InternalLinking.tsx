'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Head from 'next/head'

interface Match {
  slug: string
  homeTeam: string
  awayTeam: string
  league: string
  kickoffIso: string
  status?: string
}

interface InternalLinkingProps {
  currentMatch: Match
  className?: string
}

export default function InternalLinking({ currentMatch, className = '' }: InternalLinkingProps) {
  const [relatedMatches, setRelatedMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Generate structured data for SEO
  const generateStructuredData = () => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Related Football Matches",
      "description": `Related live football matches and streams for ${currentMatch.homeTeam} vs ${currentMatch.awayTeam}`,
      "numberOfItems": relatedMatches.length,
      "itemListElement": relatedMatches.map((match, index) => ({
        "@type": "SportsEvent",
        "@id": `https://kickaiofmatches.com/watch/${match.slug}`,
        "position": index + 1,
        "name": `${match.homeTeam} vs ${match.awayTeam}`,
        "description": `Live football match: ${match.homeTeam} versus ${match.awayTeam} in ${match.league}`,
        "startDate": match.kickoffIso,
        "sport": "Football",
        "competitor": [
          {
            "@type": "SportsTeam",
            "name": match.homeTeam
          },
          {
            "@type": "SportsTeam",
            "name": match.awayTeam
          }
        ],
        "organizer": {
          "@type": "SportsOrganization",
          "name": match.league
        },
        "url": `https://kickaiofmatches.com/watch/${match.slug}`,
        "offers": {
          "@type": "Offer",
          "name": "Live Stream Access",
          "description": "Watch live football match in 4K quality",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock"
        }
      }))
    }
    return JSON.stringify(structuredData)
  }

  // Scroll functions
  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' })
    }
  }

  const checkScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    async function fetchRelatedMatches() {
      try {
        const response = await fetch(`/api/matches/related?slug=${currentMatch.slug}&league=${encodeURIComponent(currentMatch.league)}&teams=${encodeURIComponent(`${currentMatch.homeTeam},${currentMatch.awayTeam}`)}`)
        if (response.ok) {
          const data = await response.json()
          setRelatedMatches(data.matches || [])
        }
      } catch (error) {
        console.error('Failed to fetch related matches:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedMatches()
  }, [currentMatch.slug, currentMatch.league, currentMatch.homeTeam, currentMatch.awayTeam])

  // Check scroll buttons on mount and resize
  useEffect(() => {
    const timer = setTimeout(() => {
      checkScrollButtons()
    }, 100)

    const handleResize = () => checkScrollButtons()
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [relatedMatches])

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-700 rounded mb-3 w-1/3"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-800 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const semanticLinks = [
    {
      title: `${currentMatch.league} Live Football Matches & Streams`,
      href: `/league/${currentMatch.league.toLowerCase().replace(/\s+/g, '-')}`,
      description: `Watch all ${currentMatch.league} live football matches in 4K quality with HD streaming`,
      keywords: `${currentMatch.league}, live football, football streaming, 4K football`
    },
    {
      title: `${currentMatch.homeTeam} Live Fixtures & Match Schedule`,
      href: `/team/${currentMatch.homeTeam.toLowerCase().replace(/\s+/g, '-')}`,
      description: `Complete ${currentMatch.homeTeam} fixtures, live matches, and football streaming schedule`,
      keywords: `${currentMatch.homeTeam}, football fixtures, live matches, team schedule`
    },
    {
      title: `${currentMatch.awayTeam} Football Schedule & Live Streams`,
      href: `/team/${currentMatch.awayTeam.toLowerCase().replace(/\s+/g, '-')}`,
      description: `${currentMatch.awayTeam} complete match schedule with live football streaming options`,
      keywords: `${currentMatch.awayTeam}, football schedule, live streaming, team matches`
    },
    {
      title: 'Live Football Streaming - Watch Matches Online',
      href: '/live',
      description: 'Watch live football matches from Premier League, Champions League, and top leagues worldwide',
      keywords: 'live football streaming, watch football online, football matches live'
    },
    {
      title: 'Premium IPTV Football Channels - 4K Streaming',
      href: '/channels',
      description: '15,000+ premium live sports channels featuring football, soccer, and sports in 4K quality',
      keywords: 'IPTV football channels, premium sports streaming, 4K football, live sports'
    }
  ]

  return (
    <>
      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .carousel-container {
          scroll-snap-type: x mandatory;
        }
        .carousel-item {
          scroll-snap-align: start;
        }
      `}</style>

      {/* JSON-LD Structured Data */}
      {relatedMatches.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: generateStructuredData() }}
        />
      )}

      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-gray-400" itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/" className="hover:text-gold-300 transition-colors" itemProp="item">
              <span itemProp="name">Home</span>
            </Link>
            <meta itemProp="position" content="1" />
          </li>
          <li className="text-gray-600">›</li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <Link href="/live" className="hover:text-gold-300 transition-colors" itemProp="item">
              <span itemProp="name">Live Football</span>
            </Link>
            <meta itemProp="position" content="2" />
          </li>
          <li className="text-gray-600">›</li>
          <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
            <span className="text-white" itemProp="name">Related Matches</span>
            <meta itemProp="position" content="3" />
          </li>
        </ol>
      </nav>

      <section className={`w-full mt-12 ${className}`} role="complementary" aria-labelledby="related-matches-heading">
        {/* Related Matches Carousel */}
        {relatedMatches.length > 0 && (
          <div className="w-full">
            <div className="text-center mb-8">
              <h2
                id="related-matches-heading"
                className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3"
              >
                ⚽ Related Live Football Matches
              </h2>
              <p className="text-gray-400 text-lg">
                Discover more exciting matches and never miss a goal!
              </p>
            </div>

            {/* Full-Width Horizontal Carousel */}
            <div className="relative w-full">
              {/* Navigation Arrows */}
              {canScrollLeft && (
                <button
                  onClick={() => scrollLeft()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Scroll left"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {canScrollRight && (
                <button
                  onClick={() => scrollRight()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-black/80 hover:bg-black text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
                  aria-label="Scroll right"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              <div
                ref={scrollContainerRef}
                className="overflow-x-auto scrollbar-hide scroll-smooth carousel-container"
                onScroll={checkScrollButtons}
              >
                <div className="flex gap-6 pb-4 px-4" style={{ width: 'max-content' }}>
                  {relatedMatches.slice(0, 8).map((match) => {
                    const isLive = match.status === 'live'
                    const kickoff = new Date(match.kickoffIso)
                    const matchDate = kickoff.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })

                    return (
                      <article
                        key={match.slug}
                        className="flex-shrink-0 w-80 lg:w-96 carousel-item"
                        itemScope
                        itemType="https://schema.org/SportsEvent"
                      >
                        <Link
                          href={`/watch/${match.slug}`}
                          className="group block relative overflow-hidden rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                          title={`Watch ${match.homeTeam} vs ${match.awayTeam} live stream - ${match.league}`}
                          aria-label={`Live football match: ${match.homeTeam} versus ${match.awayTeam} in ${match.league}`}
                        >
                          {/* Card Background with Gradient */}
                          <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black border border-gray-700/50 group-hover:border-gold-500/50 rounded-2xl p-6 h-full relative overflow-hidden">
                            {/* Background Pattern */}
                            <div className="absolute inset-0 bg-gradient-to-r from-gold-600/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Live Badge */}
                            {isLive && (
                              <div className="absolute top-4 right-4 z-10">
                                <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-2 shadow-lg">
                                  <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                                  🔴 LIVE
                                </span>
                              </div>
                            )}

                            {/* Match Icon */}
                            <div className="text-center mb-4">
                              <div className="text-6xl mb-2 group-hover:scale-110 transition-transform duration-300">
                                ⚽
                              </div>
                            </div>
                            {/* Match Title */}
                            <div className="text-center mb-4 relative z-10">
                              <h3
                                className="text-2xl font-bold text-white group-hover:text-gold-300 transition-colors mb-2"
                                itemProp="name"
                              >
                                <span itemProp="homeTeam" itemScope itemType="https://schema.org/SportsTeam">
                                  <span itemProp="name">{match.homeTeam}</span>
                                </span>
                                <span className="text-gold-400 mx-2">VS</span>
                                <span itemProp="awayTeam" itemScope itemType="https://schema.org/SportsTeam">
                                  <span itemProp="name">{match.awayTeam}</span>
                                </span>
                              </h3>

                              <div className="text-gray-300 font-medium mb-1" itemProp="sport">
                                🏆 {match.league}
                              </div>

                              <div className="flex items-center justify-center gap-2 text-gray-400">
                                <span>📅</span>
                                <time itemProp="startDate" dateTime={match.kickoffIso}>
                                  {matchDate} • {kickoff.toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </time>
                              </div>
                            </div>

                            {/* Match Description */}
                            <div className="text-center mb-6 relative z-10">
                              <p className="text-gray-300 text-sm leading-relaxed">
                                Watch this exciting {match.league} match in stunning 4K quality.
                                Get instant access to live streaming with multiple camera angles.
                              </p>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-3 gap-3 mb-6 relative z-10">
                              <div className="text-center">
                                <div className="text-2xl mb-1">⚡</div>
                                <div className="text-xs text-gray-400">Instant Access</div>
                              </div>
                              <div className="text-center">
                                <div className="text-2xl mb-1">📺</div>
                                <div className="text-xs text-gray-400">4K Quality</div>
                              </div>
                            </div>

                            {/* Call to Action Button */}
                            <div className="text-center relative z-10">
                              <div className="bg-gradient-to-r from-gold-600 to-red-600 hover:from-gold-500 hover:to-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 group-hover:shadow-lg group-hover:shadow-gold-500/25">
                                <span className="flex items-center justify-center gap-2">
                                  {isLive ? '🔴 Watch Live Now' : '⚡ Get Instant Access'}
                                  <span className="text-lg">→</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </article>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* SEO-friendly text content */}
            <div className="mt-8 bg-gray-900/30 rounded-xl p-6 border border-gray-700/30">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                📈 Why Choose Our Live Football Streaming?
              </h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-300 leading-relaxed">
                <div>
                  <p className="mb-3">
                    <strong className="text-gold-400">Premium Quality Streaming:</strong> Experience {currentMatch.homeTeam} vs {currentMatch.awayTeam} and similar {currentMatch.league} matches in stunning 4K resolution with crystal-clear audio and multiple camera angles.
                  </p>
                  <p className="mb-3">
                    <strong className="text-gold-400">Instant Access:</strong> No waiting periods or complicated setups. Get immediate access to live football streaming with just one click. Watch Premier League, Champions League, La Liga, Serie A, and Bundesliga matches instantly.
                  </p>
                </div>
                <div>
                  <p className="mb-3">
                    <strong className="text-gold-400">Comprehensive Coverage:</strong> Access thousands of live football matches, exclusive highlights, expert commentary, and real-time statistics. Never miss a goal with our comprehensive sports coverage.
                  </p>
                  <p className="mb-3">
                    <strong className="text-gold-400">SEO Keywords:</strong> live football streaming, watch football online, {currentMatch.league} live matches, {currentMatch.homeTeam} fixtures, {currentMatch.awayTeam} schedule, football highlights, 4K sports streaming, IPTV football channels, premium sports access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Semantic Link Clusters - Enhanced for SEO */}
        <div className="mt-12">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              🔗 Explore More Football Content
            </h3>
            <p className="text-gray-400">
              Discover premium football streaming across all major leagues and competitions
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {semanticLinks.map((link, index) => (
              <Link
                key={index}
                href={link.href}
                className="group block bg-gradient-to-br from-gray-800/50 via-gray-900/50 to-black/50 hover:from-gold-800/30 hover:via-red-800/30 hover:to-black/50 rounded-xl p-6 transition-all duration-300 border border-gray-700/30 hover:border-gold-500/50 transform hover:scale-105 hover:shadow-xl"
                title={`${link.title} - ${link.keywords}`}
                aria-label={link.description}
              >
                <div className="text-center">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    {index === 0 ? '🏆' : index === 1 ? '⚽' : index === 2 ? '🎯' : index === 3 ? '📺' : '👑'}
                  </div>
                  <div className="text-white font-bold text-lg group-hover:text-gold-300 transition-colors mb-2">
                    {link.title}
                  </div>
                  <div className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors leading-relaxed">
                    {link.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800/50 rounded-lg p-2">
                    Keywords: {link.keywords}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Contextual Navigation */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            📺 Quick Access to Live Football
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/live"
              className="bg-professional-red/20 hover:bg-professional-red/30 border border-professional-red/30 hover:border-professional-red/50 rounded-lg p-3 text-center transition-all duration-200 group"
            >
              <div className="text-professional-red group-hover:text-red-300 font-medium">🔴 Live Now</div>
              <div className="text-gray-400 text-xs mt-1">Watch live matches</div>
            </Link>
            <Link
              href="/upcoming"
              className="bg-gold-600/20 hover:bg-gold-600/30 border border-gold-500/30 hover:border-gold-500/50 rounded-lg p-3 text-center transition-all duration-200 group"
            >
              <div className="text-gold-400 group-hover:text-gold-300 font-medium">⏰ Upcoming</div>
              <div className="text-gray-400 text-xs mt-1">Future matches</div>
            </Link>
            <Link
              href="/highlights"
              className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 hover:border-red-500/50 rounded-lg p-3 text-center transition-all duration-200 group"
            >
              <div className="text-red-400 group-hover:text-red-300 font-medium">🎬 Highlights</div>
              <div className="text-gray-400 text-xs mt-1">Match highlights</div>
            </Link>

          </div>
        </div>
      </section>
    </>
  )
}