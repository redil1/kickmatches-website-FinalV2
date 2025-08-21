import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'
import Script from 'next/script'
import Link from 'next/link'
import { getBaseUrl } from '@/utils/url'

import Countdown from '@/components/Countdown'
import ShareReferral from '@/components/ShareReferral'
import StartTrial from '@/components/StartTrial'
import MetricBeacon from '@/components/MetricBeacon'
import { Suspense } from 'react'
import { generateMatchSEO, generateHreflangTags } from '@/utils/seo'
import InternalLinking from '@/components/InternalLinking'
import type { Metadata } from 'next'



// Use Next.js inferred PageProps type via the generated .next types
// Fallback to a minimal shape for editor support
type PageProps = { params: any }

export const revalidate = 3600

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const [match] = await db.select().from(matches).where(eq(matches.slug, resolvedParams.slug)).limit(1)
  
  if (!match) {
    return {
      title: 'Match Not Found | Kick AI of Matches',
      description: 'The requested match could not be found. Browse our live football matches and premium IPTV streaming.'
    }
  }

  const baseUrl = getBaseUrl()
  const seoData = generateMatchSEO({
    slug: match.slug as string,
    homeTeam: match.homeTeam as string,
    awayTeam: match.awayTeam as string,
    league: match.league as string,
    kickoffIso: (match.kickoffIso instanceof Date ? match.kickoffIso.toISOString() : (match.kickoffIso as unknown as string)),
    status: match.status as string,
    scorebatEmbed: match.scorebatEmbed as string
  }, baseUrl)

  const hreflangTags = generateHreflangTags(seoData.canonicalUrl)

  return {
    title: seoData.title,
    description: seoData.description,
  keywords: seoData.keywords.join(', '),
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
    },
    openGraph: {
      ...seoData.openGraph,
      type: 'video.other'
    },
    twitter: seoData.twitter,
    alternates: {
      canonical: seoData.canonicalUrl,
      languages: Object.fromEntries(
        hreflangTags.map(tag => [`${tag.code}-${tag.region}`, tag.url])
      )
    },
    other: {
      'article:author': 'Kick AI of Matches',
      'article:publisher': 'Kick AI of Matches',
      'fb:app_id': '123456789',
      'theme-color': '#1e293b'
    }
  }
}

export default async function MatchPage({ params }: PageProps) {
  const resolvedParams = await params
  const [match] = await db.select().from(matches).where(eq(matches.slug, resolvedParams.slug)).limit(1)
  if (!match) return <div className="p-8 text-red-600">Match not found</div>

  const kickoff = new Date(match.kickoffIso as unknown as string)
  const baseUrl = getBaseUrl()
  
  // Generate comprehensive SEO data
  const seoData = generateMatchSEO({
    slug: match.slug as string,
    homeTeam: match.homeTeam as string,
    awayTeam: match.awayTeam as string,
    league: match.league as string,
    kickoffIso: (match.kickoffIso instanceof Date ? match.kickoffIso.toISOString() : (match.kickoffIso as unknown as string)),
    status: match.status as string,
    scorebatEmbed: match.scorebatEmbed as string
  }, baseUrl)
  


  const isLive = new Date() >= kickoff && new Date() <= new Date(kickoff.getTime() + 120 * 60 * 1000) // 2 hours
  const isUpcoming = new Date() < kickoff
  const timeToKickoff = kickoff.getTime() - new Date().getTime()
  const showCountdown = isUpcoming && timeToKickoff < 24 * 60 * 60 * 1000 // Show countdown if less than 24h
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-800 to-black-900">
      <MetricBeacon event="page_view" payload={{ slug: match.slug, league: match.league }} />
      
      {/* Comprehensive Structured Data */}
      {seoData.structuredData.map((schema, index) => (
        <Script key={index} id={`json-ld-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </Script>
      ))}
      
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
            <li>
              <Link href="/matches" className="text-gray-300 hover:text-white transition-colors">
                📺 Live Matches
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li>
              <Link href={`/leagues/${match.league?.toLowerCase().replace(/\s+/g, '-')}`} className="text-gray-300 hover:text-white transition-colors">
                🏆 {match.league}
              </Link>
            </li>
            <li className="text-gray-500">/</li>
            <li className="text-white font-medium" aria-current="page">
              ⚽ {match.homeTeam} vs {match.awayTeam}
            </li>
          </ol>
        </div>
      </nav>
      
      {/* Real-Time Credentials Banner */}
      <div className="bg-gradient-to-r from-gold-600/20 to-gold-500/20 border-b border-gold-500/30">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-gold-500/30 text-gold-300 px-6 py-2 rounded-full font-bold mb-3">
              ⚡ INSTANT ACTIVATION - NO WAITING
            </div>
            <p className="text-white font-bold text-lg">
              Your IPTV credentials are delivered in <span className="text-gold-400">real-time</span> - 
              <span className="text-gold-400">access within 15 seconds</span> of signup!
            </p>
          </div>
        </div>
      </div>

      {/* Top Conversion Sections */}
      <div className="bg-gradient-to-r from-black-800/30 via-gold-600/10 to-red-600/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Simple Alert Button */}
            <div className="flex justify-center mb-16">
              <button className="group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50">
                <span className="text-xl">🔔</span>
                <span>Get Match Alerts</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
            
            {/* Get Premium Access Section */}
            <div className="bg-gradient-to-br from-red-500/20 to-red-600/30 backdrop-blur-lg rounded-2xl p-6 border border-red-400/20 hover:border-red-400/40 transition-all duration-300 group">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-r from-red-500 to-red-600 p-3 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <span className="text-2xl">👑</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-300 transition-colors">
                    Premium IPTV Access
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    Unlock 8,000+ live channels, 50,000+ movies & shows with <span className="text-gold-400 font-bold">instant activation</span>. 
                    <span className="text-gold-400 font-bold">Real-time credential delivery</span> - no waiting period!
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gold-500/30 text-gold-200 px-2 py-1 rounded-full text-xs font-medium">⚡ Live in 15s</span>
                    <span className="bg-red-500/30 text-red-200 px-2 py-1 rounded-full text-xs font-medium">📺 8K+ Channels</span>
                    <span className="bg-red-500/30 text-red-200 px-2 py-1 rounded-full text-xs font-medium">🎬 50K+ Content</span>
                  </div>
                  <a
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group"
                    href={`https://www.iptv.shopping/pricing?utm_source=pmm&utm_medium=site&utm_campaign=top_conversion&match=${encodeURIComponent(
                      match.slug as unknown as string
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ⚡ Get Instant Access
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </a>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black-800/40 to-red-600/20"></div>
        <div className="relative mx-auto max-w-7xl px-4 py-12">
          
          {/* Live/Upcoming Badge */}
          <div className="mb-6 flex justify-center">
            {isLive ? (
              <span className="animate-pulse bg-red-500 px-6 py-2 rounded-full text-white font-bold text-lg flex items-center gap-2">
                🔴 LIVE NOW
              </span>
            ) : isUpcoming ? (
              <span className="bg-gold-500 px-6 py-2 rounded-full text-white font-bold text-lg flex items-center gap-2">
                🕒 UPCOMING
              </span>
            ) : (
              <span className="bg-gray-500 px-6 py-2 rounded-full text-white font-bold text-lg">
                📺 HIGHLIGHTS AVAILABLE
              </span>
            )}
          </div>

          {/* Main Title */}
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 leading-tight">
              <span className="bg-gradient-to-r from-gold-400 to-gold-500 bg-clip-text text-transparent">
                {match.homeTeam}
              </span>
              <span className="text-white mx-4">VS</span>
              <span className="bg-gradient-to-r from-red-400 to-red-500 bg-clip-text text-transparent">
                {match.awayTeam}
              </span>
            </h1>
            <div className="flex items-center justify-center gap-4 text-xl text-gray-300">
              <span className="bg-gold-500 text-black px-3 py-1 rounded font-bold">{match.league}</span>
              <span>•</span>
              <span>{format(kickoff, 'PPpp')}</span>
            </div>
          </div>

          {/* Countdown Timer */}
          {showCountdown && (
            <div className="mb-12">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">⏰ KICKOFF IN</h2>
              </div>
              <div className="flex justify-center">
                <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10">
                  <Countdown to={kickoff.toISOString()} />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons - Centered Trial Section */}
          <div className="flex justify-center items-center mb-12">
            <StartTrial slug={match.slug as unknown as string} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Left Column - Match Info & Stats */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Score Card (if live) */}
            {isLive && (
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="text-center">
                  <h3 className="text-white text-2xl font-bold mb-4">🔴 LIVE SCORE</h3>
                  <div className="flex items-center justify-between text-white">
                    <div className="text-center">
                      <div className="text-xl font-bold">{match.homeTeam}</div>
                      <div className="text-4xl font-black text-gold-400">-</div>
                    </div>
                    <div className="text-6xl font-black">VS</div>
                    <div className="text-center">
                      <div className="text-xl font-bold">{match.awayTeam}</div>
                      <div className="text-4xl font-black text-red-400">-</div>
                    </div>
                  </div>
                  <div className="mt-4 text-gold-400 font-bold">⚽ Live updates coming soon</div>
                </div>
              </div>
            )}

            {/* Match Preview/Analysis */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                📊 Match Analysis
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gold-500/20 rounded-lg p-4">
                    <h4 className="text-gold-400 font-bold text-lg">{match.homeTeam}</h4>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-white">
                        <span>Form</span>
                        <span className="font-bold">W-W-D-W-L</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Goals Scored</span>
                        <span className="font-bold text-gold-400">24</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Goals Conceded</span>
                        <span className="font-bold text-red-400">12</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-bold text-lg">{match.awayTeam}</h4>
                    <div className="space-y-2 mt-2">
                      <div className="flex justify-between text-white">
                        <span>Form</span>
                        <span className="font-bold">W-L-W-W-D</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Goals Scored</span>
                        <span className="font-bold text-gold-400">28</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Goals Conceded</span>
                        <span className="font-bold text-red-400">15</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Head to Head */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                ⚔️ Head to Head
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <span className="text-white">Last 5 meetings</span>
                  <span className="text-gold-400 font-bold">3W - 1D - 1L</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <span className="text-white">Goals average</span>
                  <span className="text-gold-400 font-bold">2.8 per game</span>
                </div>
                <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
                  <span className="text-white">Last meeting</span>
                  <span className="text-white font-bold">2-1 ({match.homeTeam})</span>
                </div>
              </div>
            </div>

            {/* Team Lineups & Key Players */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                👥 Expected Lineups & Key Players
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gold-500/20 rounded-lg p-4">
                    <h4 className="text-gold-400 font-bold text-lg mb-3">{match.homeTeam}</h4>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-white font-semibold text-sm mb-2">Formation: 4-3-3</h5>
                        <div className="text-gray-300 text-sm space-y-1">
                          <div><span className="text-gold-400">GK:</span> Drake Callender</div>
                          <div><span className="text-gold-400">DEF:</span> Jordi Alba, Sergio Busquets, Tomás Avilés</div>
                          <div><span className="text-gold-400">MID:</span> Federico Redondo, Yannick Bright</div>
                          <div><span className="text-gold-400">FWD:</span> Lionel Messi, Luis Suárez, Robert Taylor</div>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-3">
                        <h6 className="text-gold-400 text-sm font-bold mb-2">Key Player to Watch</h6>
                        <div className="text-white text-sm">
                          <strong>Lionel Messi</strong> - 8 goals in last 10 games, exceptional form
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-bold text-lg mb-3">{match.awayTeam}</h4>
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-white font-semibold text-sm mb-2">Formation: 4-2-3-1</h5>
                        <div className="text-gray-300 text-sm space-y-1">
                          <div><span className="text-red-400">GK:</span> Nahuel Guzmán</div>
                          <div><span className="text-red-400">DEF:</span> Jesús Angulo, Diego Reyes, Guido Pizarro</div>
                          <div><span className="text-red-400">MID:</span> Luis Quiñones, Rafael Carioca</div>
                          <div><span className="text-red-400">FWD:</span> André-Pierre Gignac, Nicolás López</div>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-3">
                        <h6 className="text-red-400 text-sm font-bold mb-2">Key Player to Watch</h6>
                        <div className="text-white text-sm">
                          <strong>André-Pierre Gignac</strong> - Top scorer with 12 goals this season
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Form & Statistics */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                📈 Recent Form & Season Statistics
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gold-500/20 rounded-lg p-4">
                    <h4 className="text-gold-400 font-bold text-lg">{match.homeTeam}</h4>
                    <div className="space-y-3 mt-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between text-white">
                            <span>League Position</span>
                            <span className="font-bold text-gold-400">3rd</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Points</span>
                            <span className="font-bold">45</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Wins</span>
                            <span className="font-bold text-green-400">14</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Draws</span>
                            <span className="font-bold text-yellow-400">3</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-white">
                            <span>Losses</span>
                            <span className="font-bold text-red-400">5</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Home Record</span>
                            <span className="font-bold text-gold-400">8W-1D-2L</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Clean Sheets</span>
                            <span className="font-bold">8</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Avg Goals/Game</span>
                            <span className="font-bold text-gold-400">2.3</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-3">
                        <div className="text-sm text-gray-300 mb-2">Last 5 Results:</div>
                        <div className="flex gap-1">
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">W</span>
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">W</span>
                          <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">D</span>
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">W</span>
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">L</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-bold text-lg">{match.awayTeam}</h4>
                    <div className="space-y-3 mt-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between text-white">
                            <span>League Position</span>
                            <span className="font-bold text-red-400">1st</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Points</span>
                            <span className="font-bold">52</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Wins</span>
                            <span className="font-bold text-green-400">16</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Draws</span>
                            <span className="font-bold text-yellow-400">4</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-white">
                            <span>Losses</span>
                            <span className="font-bold text-red-400">2</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Away Record</span>
                            <span className="font-bold text-red-400">7W-2D-2L</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Clean Sheets</span>
                            <span className="font-bold">12</span>
                          </div>
                          <div className="flex justify-between text-white">
                            <span>Avg Goals/Game</span>
                            <span className="font-bold text-red-400">2.7</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-black/30 rounded p-3">
                        <div className="text-sm text-gray-300 mb-2">Last 5 Results:</div>
                        <div className="flex gap-1">
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">W</span>
                          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">L</span>
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">W</span>
                          <span className="px-2 py-1 bg-green-500 text-white text-xs rounded">W</span>
                          <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded">D</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Match Context & Tournament Info */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                🏆 Tournament Context & Venue Details
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-lg p-4">
                    <h4 className="text-blue-400 font-bold text-lg mb-3">{match.league} Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white">
                        <span>Tournament Stage</span>
                        <span className="font-bold text-blue-400">Knockout Phase</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Round</span>
                        <span className="font-bold">Round of 16</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Prize Money</span>
                        <span className="font-bold text-gold-400">$1M Winner</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Total Teams</span>
                        <span className="font-bold">47</span>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-black/30 rounded">
                      <div className="text-white text-sm">
                        <strong>Stakes:</strong> Winner advances to quarter-finals. Loser eliminated from tournament.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-4">
                    <h4 className="text-emerald-400 font-bold text-lg mb-3">Venue & Match Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white">
                        <span>Stadium</span>
                        <span className="font-bold text-emerald-400">DRV PNK Stadium</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Location</span>
                        <span className="font-bold">Fort Lauderdale, FL</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Capacity</span>
                        <span className="font-bold">18,000</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Surface</span>
                        <span className="font-bold">Natural Grass</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Weather</span>
                        <span className="font-bold">82°F, Clear</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Referee</span>
                        <span className="font-bold">César Ramos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Historical Records */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                📚 Historical Records & Achievements
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-gold-500/20 rounded-lg p-4">
                    <h4 className="text-gold-400 font-bold text-lg mb-3">{match.homeTeam} Records</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white">
                        <span>MLS Cups</span>
                        <span className="font-bold text-gold-400">0</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Supporters' Shield</span>
                        <span className="font-bold text-gold-400">1 (2022)</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Leagues Cup Best</span>
                        <span className="font-bold">Quarter-finals (2023)</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>All-time Top Scorer</span>
                        <span className="font-bold">Lionel Messi (25)</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Most Appearances</span>
                        <span className="font-bold">DeAndre Yedlin (89)</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-red-500/20 rounded-lg p-4">
                    <h4 className="text-red-400 font-bold text-lg mb-3">{match.awayTeam} Records</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white">
                        <span>Liga MX Titles</span>
                        <span className="font-bold text-red-400">8</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>CONCACAF Champions League</span>
                        <span className="font-bold text-red-400">1 (2020)</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Leagues Cup Best</span>
                        <span className="font-bold">Winners (2023)</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>All-time Top Scorer</span>
                        <span className="font-bold">André-Pierre Gignac (158)</span>
                      </div>
                      <div className="flex justify-between text-white">
                        <span>Most Appearances</span>
                        <span className="font-bold">Nahuel Guzmán (312)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Highlights Section */}
            {match.scorebatEmbed && (
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-white text-2xl font-bold mb-4 flex items-center gap-2">
                  🎬 Official Highlights
                </h3>
                <div className="rounded-lg overflow-hidden">
                  <div dangerouslySetInnerHTML={{ __html: match.scorebatEmbed }} />
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Live Chat/Comments */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                💬 Live Discussion
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gold-400 font-bold text-sm">FanBoy23</div>
                  <div className="text-white text-sm">This is going to be epic! 🔥</div>
                  <div className="text-gray-400 text-xs mt-1">2 min ago</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-red-400 font-bold text-sm">SoccerExpert</div>
                  <div className="text-white text-sm">Home team has the advantage</div>
                  <div className="text-gray-400 text-xs mt-1">5 min ago</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="text-gold-400 font-bold text-sm">GoalMachine</div>
                  <div className="text-white text-sm">Expecting 3+ goals tonight!</div>
                  <div className="text-gray-400 text-xs mt-1">8 min ago</div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <input 
                  type="text" 
                  placeholder="Join the conversation..." 
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-gold-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Match Predictions */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-white text-xl font-bold mb-4 flex items-center gap-2">
                🔮 AI Predictions
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl mb-2">⚽</div>
                  <div className="text-white font-bold">Win Probability</div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gold-400">Home: 45%</span>
                    <span className="text-gray-400">Draw: 25%</span>
                    <span className="text-red-400">Away: 30%</span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-gold-500 via-gray-500 to-red-500" style={{background: 'linear-gradient(to right, #eab308 45%, #6b7280 45% 70%, #ef4444 70%)'}}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-white">
                    <span>Expected Goals</span>
                    <span className="font-bold text-gold-400">2.5</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Both Teams Score</span>
                    <span className="font-bold text-gold-400">75%</span>
                  </div>
                </div>
              </div>
            </div>



            {/* Social Sharing */}
            <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <ShareReferral slug={match.slug as unknown as string} />
            </div>
          </div>
        </div>
      </div>

      {/* Related Matches - Full Width Bottom Section */}
      <div className="w-full mt-12">
        <Suspense fallback={<div className="text-gray-400 text-center py-8">Loading related content...</div>}>
          <InternalLinking 
            currentMatch={{
              slug: match.slug as string,
              homeTeam: match.homeTeam as string,
              awayTeam: match.awayTeam as string,
              league: match.league as string,
              kickoffIso: (match.kickoffIso instanceof Date ? match.kickoffIso.toISOString() : (match.kickoffIso as unknown as string)),
              status: match.status as string
            }}
            className="bg-black/30 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
          />
        </Suspense>
      </div>

      {/* Floating Action Button */}
      {isUpcoming && timeToKickoff < 60 * 60 * 1000 && ( // Show if less than 1 hour
        <div className="fixed bottom-6 right-6 z-50">
          <button className="bg-red-500 hover:bg-red-600 text-white p-4 rounded-full shadow-2xl animate-pulse">
            <span className="text-2xl">🚨</span>
          </button>
        </div>
      )}
    </div>
  )
}


