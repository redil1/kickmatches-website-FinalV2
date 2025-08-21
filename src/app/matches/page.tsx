'use client'

import { Suspense, useState, useEffect } from 'react'
import { format, isToday, isTomorrow, isPast, isFuture } from 'date-fns'
import Link from 'next/link'
import Script from 'next/script'

import MetricBeacon from '@/components/MetricBeacon'
import type { Metadata } from 'next'

// Metadata is handled by the parent layout since this is now a client component

interface SearchParams {
  page?: string
  league?: string
  status?: string
  search?: string
  date?: string
}

interface MatchesPageProps {
  searchParams: SearchParams
}

interface Match {
  slug: string
  kickoffIso: string
  status?: string
  league: string
  homeTeam: string
  awayTeam: string
}

// Get match status based on kickoff time
function getMatchStatus(kickoffIso: string, status?: string) {
  const kickoff = new Date(kickoffIso)
  const now = new Date()
  
  if (status === 'live') return 'live'
  if (isPast(kickoff)) return 'completed'
  if (isToday(kickoff)) return 'today'
  if (isTomorrow(kickoff)) return 'tomorrow'
  return 'upcoming'
}

// Get status badge styling
function getStatusBadge(status: string) {
  switch (status) {
    case 'live':
      return 'bg-red-600 text-white animate-pulse'
    case 'today':
      return 'bg-green-600 text-white'
    case 'tomorrow':
      return 'bg-blue-600 text-white'
    case 'completed':
      return 'bg-gray-600 text-white'
    default:
      return 'bg-gold-600 text-black'
  }
}

// Get status label
function getStatusLabel(status: string) {
  switch (status) {
    case 'live': return '🔴 LIVE'
    case 'today': return '📅 TODAY'
    case 'tomorrow': return '📅 TOMORROW'
    case 'completed': return '✅ COMPLETED'
    default: return '⏰ UPCOMING'
  }
}

// All Matches Component
function AllMatches({ searchParams }: { searchParams: SearchParams }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [leagues, setLeagues] = useState<string[]>([])
  const [totalMatches, setTotalMatches] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const page = parseInt(searchParams.page || '1')
  const pageSize = 50
  const totalPages = Math.ceil(totalMatches / pageSize)
  
  useEffect(() => {
    async function fetchMatches() {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (searchParams.page) params.set('page', searchParams.page)
        if (searchParams.league) params.set('league', searchParams.league)
        if (searchParams.status) params.set('status', searchParams.status)
        if (searchParams.search) params.set('search', searchParams.search)
        if (searchParams.date) params.set('date', searchParams.date)
        
        const response = await fetch(`/api/matches?${params.toString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch matches')
        }
        
        const data = await response.json()
        setMatches(data.matches || [])
        setLeagues(data.leagues || [])
        setTotalMatches(data.totalMatches || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }
    
    fetchMatches()
  }, [searchParams])
  
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading matches...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-white mb-2">Unable to Load Matches</h3>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-6 py-3 rounded-lg font-bold hover:from-gold-600 hover:to-gold-700 transition-all"
        >
          Try Again
        </button>
      </div>
    )
  }
    
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⚽</div>
        <h3 className="text-2xl font-bold text-white mb-2">No Matches Found</h3>
        <p className="text-gray-400 mb-6">Try adjusting your filters or search terms.</p>
        <Link
          href="/matches"
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-black px-6 py-3 rounded-lg font-bold hover:from-gold-600 hover:to-gold-700 transition-all"
        >
          View All Matches
        </Link>
      </div>
    )
  }
  
  // Group matches by status
  const groupedMatches = matches.reduce((acc, match) => {
    const status = getMatchStatus(match.kickoffIso, match.status)
    if (!acc[status]) acc[status] = []
    acc[status].push(match)
    return acc
  }, {} as Record<string, Match[]>)
    
    return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-black-800/50 backdrop-blur-lg rounded-2xl p-6 border border-gold-500/20">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Teams/League</label>
              <input
                type="text"
                placeholder="Search..."
                defaultValue={searchParams.search || ''}
                className="w-full bg-black-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-gold-500 focus:outline-none"
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  if (e.target.value) {
                    url.searchParams.set('search', e.target.value)
                  } else {
                    url.searchParams.delete('search')
                  }
                  url.searchParams.delete('page')
                  window.location.href = url.toString()
                }}
              />
            </div>
            
            {/* League Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">League</label>
              <select
                defaultValue={searchParams.league || ''}
                className="w-full bg-black-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  if (e.target.value) {
                    url.searchParams.set('league', e.target.value)
                  } else {
                    url.searchParams.delete('league')
                  }
                  url.searchParams.delete('page')
                  window.location.href = url.toString()
                }}
              >
                <option value="">All Leagues</option>
                {leagues.map(league => (
                  <option key={league} value={league}>{league}</option>
                ))}
              </select>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                defaultValue={searchParams.status || ''}
                className="w-full bg-black-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  if (e.target.value) {
                    url.searchParams.set('status', e.target.value)
                  } else {
                    url.searchParams.delete('status')
                  }
                  url.searchParams.delete('page')
                  window.location.href = url.toString()
                }}
              >
                <option value="">All Status</option>
                <option value="live">🔴 Live</option>
                <option value="today">📅 Today</option>
                <option value="upcoming">⏰ Upcoming</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
            
            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
              <input
                type="date"
                defaultValue={searchParams.date || ''}
                className="w-full bg-black-900/50 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-gold-500 focus:outline-none"
                onChange={(e) => {
                  const url = new URL(window.location.href)
                  if (e.target.value) {
                    url.searchParams.set('date', e.target.value)
                  } else {
                    url.searchParams.delete('date')
                  }
                  url.searchParams.delete('page')
                  window.location.href = url.toString()
                }}
              />
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchParams.search || searchParams.league || searchParams.status || searchParams.date) && (
            <div className="mt-4">
              <Link
                href="/matches"
                className="text-gold-400 hover:text-gold-300 text-sm font-medium"
              >
                🗑️ Clear All Filters
              </Link>
            </div>
          )}
        </div>
        
      {/* Results Summary */}
      <div className="text-center">
        <p className="text-gray-300">
          Showing <span className="text-gold-400 font-bold">{matches.length}</span> of{' '}
          <span className="text-gold-400 font-bold">{totalMatches}</span> matches
          {searchParams.search && (
            <span> for "<span className="text-gold-400">{searchParams.search}</span>"
            </span>
          )}
        </p>
      </div>
        
        {/* Matches by Status */}
        {Object.entries(groupedMatches).map(([status, statusMatches]) => (
          <div key={status} className="space-y-4">
            <h3 className="text-2xl font-bold text-white border-b border-gold-500/30 pb-2">
              {getStatusLabel(status)} ({statusMatches.length})
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {statusMatches.map((match) => {
                const kickoff = new Date(match.kickoffIso)
                const matchStatus = getMatchStatus(match.kickoffIso, match.status)
                
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
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(matchStatus)}`}>
                        {getStatusLabel(matchStatus).split(' ')[1] || getStatusLabel(matchStatus)}
                      </span>
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
                      <div className="mt-3 bg-gradient-to-r from-gold-500 to-gold-600 text-black px-4 py-2 rounded-lg font-bold text-sm">
                        {matchStatus === 'live' ? '🔴 Watch Live' : 
                         matchStatus === 'completed' ? '📺 Watch Highlights' : 
                         '🎯 Watch Free Trial'}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-12">
            {page > 1 && (
              <Link
                href={`/matches?${new URLSearchParams({ ...searchParams, page: (page - 1).toString() }).toString()}`}
                className="bg-black-800/50 hover:bg-black-700/50 text-white px-4 py-2 rounded-lg border border-gold-500/20 hover:border-gold-500/50 transition-all"
              >
                ← Previous
              </Link>
            )}
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                if (pageNum > totalPages) return null
                
                return (
                  <Link
                    key={pageNum}
                    href={`/matches?${new URLSearchParams({ ...searchParams, page: pageNum.toString() }).toString()}`}
                    className={`px-3 py-2 rounded-lg border transition-all ${
                      pageNum === page
                        ? 'bg-gold-500 text-black border-gold-500 font-bold'
                        : 'bg-black-800/50 hover:bg-black-700/50 text-white border-gold-500/20 hover:border-gold-500/50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
            </div>
            
            {page < totalPages && (
              <Link
                href={`/matches?${new URLSearchParams({ ...searchParams, page: (page + 1).toString() }).toString()}`}
                className="bg-black-800/50 hover:bg-black-700/50 text-white px-4 py-2 rounded-lg border border-gold-500/20 hover:border-gold-500/50 transition-all"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    )
}

export default function AllMatchesPage({ searchParams }: MatchesPageProps) {
  // Since this is a client component, searchParams is already resolved
  const resolvedSearchParams = searchParams
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "All Football Matches",
    "description": "Complete database of football matches with live streaming, fixtures, and results",
    "url": "https://kickai.matches/matches",
    "mainEntity": {
      "@type": "SportsEvent",
      "name": "Football Matches Database",
      "description": "Comprehensive collection of football matches from top leagues worldwide",
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
          "name": "All Matches",
          "item": "https://kickai.matches/matches"
        }
      ]
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black-900 via-black-800 to-black-900">
      <MetricBeacon event="all_matches_page_view" />
      
      {/* Structured Data */}
      <Script id="all-matches-structured-data" type="application/ld+json">
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
              ⚽ All Matches
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
                All Football
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                Matches
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Complete database of football matches from <span className="text-gold-400 font-bold">Premier League, Champions League, La Liga</span> and more. 
              <span className="text-gold-400 font-bold">Live streaming, fixtures, and results</span> all in one place.
            </p>
          </div>

          {/* Matches Content */}
          <Suspense fallback={
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading matches...</p>
            </div>
          }>
            <AllMatches searchParams={resolvedSearchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}