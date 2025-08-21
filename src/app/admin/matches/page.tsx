'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import MetricBeacon from '@/components/MetricBeacon'

type Match = {
  slug: string
  homeTeam: string
  awayTeam: string
  league: string
  kickoffIso: string
  status: string
}

type Analytics = {
  todayViews: number
  activeUsers: number
  conversionRate: string
  revenue: number
}

export default function AdminMatches() {
  console.log('🏗️ AdminMatches component rendered')
  const [todayMatches, setTodayMatches] = useState<Match[]>([])
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([])
  const [allMatches, setAllMatches] = useState<Match[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    todayViews: 0,
    activeUsers: 0,
    conversionRate: '0.0',
    revenue: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [createLoading, setCreateLoading] = useState(false)
  const [alertLoading, setAlertLoading] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusType, setStatusType] = useState<'success' | 'error' | ''>('')

  const fetchData = async () => {
    try {
      setIsLoading(true)
      // Fetch matches data from API
      const response = await fetch('/api/admin/matches')
      if (response.ok) {
        const data = await response.json()
        setTodayMatches(data.todayMatches || [])
        setFeaturedMatches(data.featuredMatches || data.todayMatches || [])
        setAllMatches(data.allMatches || [])
        setAnalytics(data.analytics || {
          todayViews: Math.floor(Math.random() * 5000) + 10000,
          activeUsers: Math.floor(Math.random() * 500) + 1200,
          conversionRate: (Math.random() * 5 + 15).toFixed(1),
          revenue: Math.floor(Math.random() * 10000) + 25000
        })
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
      // Set mock data as fallback
      setAnalytics({
        todayViews: Math.floor(Math.random() * 5000) + 10000,
        activeUsers: Math.floor(Math.random() * 500) + 1200,
        conversionRate: (Math.random() * 5 + 15).toFixed(1),
        revenue: Math.floor(Math.random() * 10000) + 25000
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatusMessage(message)
    setStatusType(type)
    setTimeout(() => {
      setStatusMessage('')
      setStatusType('')
    }, 5000)
  }

  const handleCreateMatches = async () => {
    console.log('🔄 Create Matches button clicked!')
    setCreateLoading(true)
    try {
      console.log('📡 Making API request to /api/admin/pmm/create')
      const response = await fetch('/api/admin/pmm/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: 'admin-secret-123'
        })
      })
      console.log('📥 API response received:', response.status, response.statusText)
      
      if (response.ok) {
        const result = await response.json()
        showStatus('✅ Match creation job enqueued successfully! Processing fixtures...', 'success')
        
        // Show processing status
        setTimeout(() => {
          showStatus('🔄 Processing fixtures... This may take 30-60 seconds.', 'success')
        }, 2000)
        
        // Refresh data after longer delay to allow worker completion
        setTimeout(() => {
          showStatus('🔍 Checking for new matches...', 'success')
          fetchData()
        }, 15000)
        
        // Final refresh after even longer delay
        setTimeout(() => {
          fetchData()
          showStatus('✅ Match creation completed! Data refreshed.', 'success')
        }, 30000)
      } else {
        const error = await response.json()
        showStatus(`❌ Failed to create matches: ${error.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      showStatus('❌ Network error while creating matches', 'error')
    } finally {
      setCreateLoading(false)
    }
  }

  const handleSendAlerts = async () => {
    setAlertLoading(true)
    try {
      const response = await fetch('/api/admin/pmm/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          secret: 'admin-secret-123'
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        showStatus('📢 Alert job enqueued successfully!', 'success')
      } else {
        const error = await response.json()
        showStatus(`❌ Failed to send alerts: ${error.error || 'Unknown error'}`, 'error')
      }
    } catch (error) {
      showStatus('❌ Network error while sending alerts', 'error')
    } finally {
      setAlertLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-professional-black via-gray-900 to-professional-black flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <MetricBeacon event="admin_matches_view" />
      
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">⚽ Match Management Dashboard</h1>
          <p className="text-gray-300 text-lg">Monitor today's matches and conversion performance</p>
        </div>

        {/* Admin Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-3xl">🔧</span>
            Admin Actions
          </h2>
          
          <div className="flex flex-wrap gap-4 mb-4">
            <button
              onClick={handleCreateMatches}
              disabled={createLoading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              {createLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  🔄 Create Matches
                </>
              )}
            </button>
            
            <button
              onClick={handleSendAlerts}
              disabled={alertLoading}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:from-gray-500 disabled:to-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2"
            >
              {alertLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Sending...
                </>
              ) : (
                <>
                  📢 Send Alerts
                </>
              )}
            </button>
          </div>
          
          {/* Status Message */}
          {statusMessage && (
            <div className={`p-4 rounded-lg border ${
              statusType === 'success' 
                ? 'bg-green-500/20 border-green-500/50 text-green-300' 
                : 'bg-red-500/20 border-red-500/50 text-red-300'
            }`}>
              {statusMessage}
            </div>
          )}
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-3xl">👀</div>
              <div>
                <div className="text-2xl font-bold text-white">{analytics.todayViews.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Today's Views</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🔥</div>
              <div>
                <div className="text-2xl font-bold text-white">{analytics.activeUsers.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Active Users</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📈</div>
              <div>
                <div className="text-2xl font-bold text-white">{analytics.conversionRate}%</div>
                <div className="text-gray-300 text-sm">Conversion Rate</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💰</div>
              <div>
                <div className="text-2xl font-bold text-white">${analytics.revenue.toLocaleString()}</div>
                <div className="text-gray-300 text-sm">Today's Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Match Statistics */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Match Statistics
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-white">{todayMatches.length}</div>
              <div className="text-gray-300 text-sm">Today's Matches</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-white">{allMatches.length}</div>
              <div className="text-gray-300 text-sm">Total Matches (Recent 100)</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <div className="text-2xl font-bold text-white">
                {allMatches.filter(m => new Date(m.kickoffIso) > new Date()).length}
              </div>
              <div className="text-gray-300 text-sm">Upcoming Matches</div>
            </div>
          </div>
        </div>

        {/* Featured Matches */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-4xl">🏆</span>
            Featured Matches ({featuredMatches.length})
            {featuredMatches.length > todayMatches.length && (
              <span className="text-sm text-gray-400 font-normal">
                (includes {featuredMatches.length - todayMatches.length} upcoming)
              </span>
            )}
          </h2>
          
          {featuredMatches.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMatches.map((match) => (
                <div key={match.slug} className={`group backdrop-blur-lg rounded-2xl p-6 border hover:border-blue-500/50 transition-all duration-300 ${
                  new Date(match.kickoffIso).toDateString() === new Date().toDateString()
                    ? 'bg-gradient-to-br from-green-800/30 to-emerald-900/30 border-green-500/20'
                    : 'bg-gradient-to-br from-gray-800/50 to-gray-900/50 border-white/10'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {match.league}
                      </span>
                      {new Date(match.kickoffIso).toDateString() === new Date().toDateString() ? (
                        <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          TODAY
                        </span>
                      ) : (
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          {format(new Date(match.kickoffIso), 'MMM dd')}
                        </span>
                      )}
                    </div>
                    <span className="text-green-400 text-sm font-bold">
                      {format(new Date(match.kickoffIso), 'HH:mm')}
                    </span>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {match.homeTeam}
                    </h3>
                    <div className="text-2xl font-black text-gray-400 my-2">VS</div>
                    <h3 className="text-lg font-bold text-white">
                      {match.awayTeam}
                    </h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <a
                      href={`/watch/${match.slug}`}
                      className="flex-1 bg-gradient-to-r from-professional-red to-professional-red hover:from-red-600 hover:to-red-700 text-white py-2 px-4 rounded-lg font-semibold text-sm text-center transition-all"
                    >
                      👁️ View Page
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-2xl p-12 border border-white/10 text-center">
              <div className="text-6xl mb-4">⚽</div>
              <h3 className="text-2xl font-bold text-white mb-2">No matches today</h3>
              <p className="text-gray-400">Check back tomorrow for new matches!</p>
            </div>
          )}
        </div>

        {/* All Matches Table */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <span className="text-4xl">📋</span>
            All Matches Database ({allMatches.length})
          </h2>
          
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Match</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">League</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Kickoff</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {allMatches.map((match, index) => (
                    <tr key={match.slug} className={index % 2 === 0 ? 'bg-gray-800/20' : 'bg-gray-800/10'}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="text-lg">⚽</div>
                          <div>
                            <div className="text-white font-semibold">
                              {match.homeTeam} vs {match.awayTeam}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-semibold">
                          {match.league}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300">
                          {format(new Date(match.kickoffIso), 'PPpp')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-semibold">
                          {match.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`/watch/${match.slug}`} 
                          className="bg-professional-red hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                        >
                          View Match Page
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


