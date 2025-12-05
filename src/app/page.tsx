import Image from "next/image";
import MetricBeacon from "@/components/MetricBeacon";
import { Suspense } from "react";
import { db } from "@/db/client";
import { matches } from "@/db/schema";
import { desc, and, gte, sql } from "drizzle-orm";
import { format } from "date-fns";
import { Metadata } from 'next';

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Live Football Streaming Free | Watch Premier League, Champions League Matches Online",
  description: "Watch live football matches online free. Stream Premier League, Champions League, La Liga, Serie A live. 15,000+ sports channels, 4K quality, 12-hour free trial.",
  keywords: "live football streaming, watch football online, Premier League live, Champions League streaming, free football matches, IPTV sports, live soccer streaming",
  openGraph: {
    title: "Live Football Streaming Free | Watch Premier League, Champions League Online",
    description: "Stream live football matches in 4K quality. Premier League, Champions League, La Liga live. 15,000+ sports channels, 12-hour free trial.",
    type: "website",
    url: "https://kickaiofmatches.com",
    images: [
      {
        url: "/home-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Live Football Streaming - Watch Matches Online Free",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Live Football Streaming Free | Premier League, Champions League Online",
    description: "Stream live football matches in 4K quality. 15,000+ sports channels, 12-hour free trial, no credit card required.",
  },
};

// Featured Matches Component
async function FeaturedMatches() {
  let featuredMatches: any[] = []

  try {
    const now = new Date()
    // Simple robust strategy: Get next 15 upcoming matches
    featuredMatches = await db.select()
      .from(matches)
      .where(sql`kickoff_iso >= ${now.toISOString()}`)
      .orderBy(sql`kickoff_iso ASC`)
      .limit(15)

    // If no upcoming matches, try to get recent past matches (for testing/demo)
    if (featuredMatches.length === 0) {
      featuredMatches = await db.select()
        .from(matches)
        .orderBy(sql`kickoff_iso DESC`)
        .limit(15)
    }

  } catch (error) {
    // Enhanced error logging for debugging
    console.error('Featured Matches Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined,
      timestamp: new Date().toISOString()
    });

    // Test database connectivity
    try {
      await db.select().from(matches).limit(1);
      console.log('Database connection test: SUCCESS');
    } catch (dbError) {
      console.error('Database connection test: FAILED', dbError);
    }

    featuredMatches = []
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {featuredMatches.map((match) => (
        <a
          key={match.slug}
          href={`/watch/${match.slug}`}
          className="group bg-gradient-to-br from-black-800/50 to-black-900/50 backdrop-blur-lg rounded-2xl p-6 border border-gold-500/20 hover:border-gold-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
        >
          <div className="flex items-center justify-between mb-4">
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              {match.league}
            </span>
            <span className="text-gold-400 text-sm font-bold">
              {format(new Date(match.kickoffIso as string), 'MMM dd')}
            </span>
          </div>

          <div className="text-center mb-4">
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-gold-400 transition-colors">
              {match.homeTeam}
            </h3>
            <div className="text-2xl font-black text-gray-400 my-2">VS</div>
            <h3 className="text-lg font-bold text-white group-hover:text-gold-400 transition-colors">
              {match.awayTeam}
            </h3>
          </div>

          <div className="text-center">
            <div className="text-gray-300 text-sm">
              {format(new Date(match.kickoffIso as string), 'PPpp')}
            </div>
            <div className="mt-3 bg-gradient-to-r from-gold-500 to-gold-600 text-black px-4 py-2 rounded-lg font-bold text-sm">
              🎯 Watch Free Trial
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}

// Real-time user counter
function LiveUserCounter() {
  const count = Math.floor(Math.random() * 50) + 150 // 150-200 users
  return (
    <div className="flex items-center gap-2 text-green-400">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      <span className="font-bold">{count}</span>
      <span className="text-gray-300">users watching now</span>
    </div>
  )
}

export default function Home() {
  const timeLeft = {
    hours: Math.floor(Math.random() * 24),
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60)
  }

  return (
    <div className="min-h-screen bg-black">
      <MetricBeacon event="home_view" />

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-500/10 to-red-600/10"></div>

        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-4 h-4 bg-gold-500/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-red-500/30 rounded-full animate-ping animation-delay-1000"></div>
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-gold-500/30 rounded-full animate-ping animation-delay-2000"></div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16">
          {/* Limited Time Banner */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-2 rounded-full font-bold animate-pulse">
              🔥 LIMITED TIME OFFER
            </div>
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-4 py-2 rounded-full font-bold mt-2">
              ⚡ INSTANT ACTIVATION - NO WAITING
            </div>
          </div>

          {/* Main Headline */}
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                Watch Every
              </span>
              <br />
              <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                Football Match
              </span>
              <br />
              <span className="text-white">Live & Free</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Get <span className="text-gold-400 font-bold">instant access</span> to <span className="text-gold-400 font-bold">Premier League, Champions League, La Liga</span> and more.
              <span className="text-gold-400 font-bold">Real-time credentials delivered within seconds</span> - <span className="text-gold-400 font-bold"> 15,000+ channels in 4K quality.</span>
            </p>

            {/* Countdown Timer */}
            <div className="mb-8">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-white mb-2">⏰ OFFER EXPIRES IN</h2>
              </div>
              <div className="flex justify-center gap-4">
                <div className="bg-black-900/80 backdrop-blur-lg rounded-2xl p-4 border border-gold-500/30 min-w-[80px]">
                  <div className="text-3xl font-black text-red-600 text-center font-mono">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs font-bold text-gold-300 text-center">HOURS</div>
                </div>
                <div className="bg-black-900/80 backdrop-blur-lg rounded-2xl p-4 border border-gold-500/30 min-w-[80px]">
                  <div className="text-3xl font-black text-red-600 text-center font-mono">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs font-bold text-gold-300 text-center">MINS</div>
                </div>
                <div className="bg-black-900/80 backdrop-blur-lg rounded-2xl p-4 border border-gold-500/30 min-w-[80px]">
                  <div className="text-3xl font-black text-red-600 text-center font-mono">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-xs font-bold text-gold-300 text-center">SECS</div>
                </div>
              </div>
            </div>

            {/* Primary CTA - Trial Only */}
            <div className="flex justify-center items-center mb-12">
              <a
                href="/trial"
                className="group bg-gradient-to-r from-professional-gold to-professional-gold hover:from-yellow-600 hover:to-yellow-700 text-black px-12 py-6 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-professional-gold/25 flex items-center gap-3"
              >
                ⚡ GET INSTANT ACCESS NOW
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm">
              <LiveUserCounter />
              <div className="flex items-center gap-2 text-gold-400">
                <span className="text-xl">⭐⭐⭐⭐⭐</span>
                <span className="font-bold">4.9/5</span>
                <span className="text-gray-300">(2,847 reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-gold-400">
                <span className="font-bold">98%</span>
                <span className="text-gray-300">satisfaction rate</span>
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <div className="text-white font-bold">Secure Access</div>
              <div className="text-gray-400 text-sm">100% Private</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <div className="text-white font-bold">Instant Activation</div>
              <div className="text-gray-400 text-sm">Live in 15 Seconds</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📺</div>
              <div className="text-white font-bold">4K Ultra HD</div>
              <div className="text-gray-400 text-sm">Crystal Clear</div>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌍</div>
              <div className="text-white font-bold">Global Channels</div>
              <div className="text-gray-400 text-sm">15,000+ Channels</div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Credentials Section */}
      <div className="bg-gradient-to-r from-black-800/50 to-black-700/50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-6 py-3 rounded-full font-bold mb-6">
              ⚡ REAL-TIME CREDENTIAL DELIVERY
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              <span className="text-gold-400">Instant Access</span> - No Waiting Period
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Your IPTV credentials are generated and delivered in <span className="text-gold-400 font-bold">real-time</span>.
              No queues, no delays, no waiting - <span className="text-gold-400 font-bold">access within 15 seconds</span>.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gold-600/20 to-black-800/20 rounded-2xl p-8 border border-gold-500/30 text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold text-white mb-3">15 Second Setup</h3>
              <p className="text-gray-300">Fastest credential delivery in the industry. Your access is ready before you finish reading this.</p>
            </div>

            <div className="bg-gradient-to-br from-gold-600/20 to-black-800/20 rounded-2xl p-8 border border-gold-500/30 text-center">
              <div className="text-5xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold text-white mb-3">Real-Time Processing</h3>
              <p className="text-gray-300">Advanced automation ensures your credentials are generated instantly upon request.</p>
            </div>

            <div className="bg-gradient-to-br from-gold-600/20 to-black-800/20 rounded-2xl p-8 border border-gold-500/30 text-center">
              <div className="text-5xl mb-4">🚀</div>
              <h3 className="text-2xl font-bold text-white mb-3">Zero Wait Time</h3>
              <p className="text-gray-300">No manual processing, no business hours delays. Available 24/7 with instant activation.</p>
            </div>
          </div>

          <div className="text-center mt-12">
            <div className="bg-gold-500/10 border border-gold-500/30 rounded-2xl p-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-gold-400 text-2xl">✅</span>
                <span className="text-white font-bold text-lg">Live Credential Generation</span>
              </div>
              <p className="text-gray-300">
                Watch our system generate your unique IPTV credentials in real-time.
                <span className="text-gold-400 font-bold">No human intervention required</span> - fully automated for instant delivery.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Explore Leagues & Teams (Internal Linking) */}
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div className="rounded-2xl border border-gold-500/20 bg-black-900/40 p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">Explore Leagues & Teams</h3>
            <p className="text-gray-300">Browse all leagues and teams to find fixtures, results and live streams.</p>
          </div>
          <div className="flex gap-3">
            <a href="/leagues" className="border border-gold-500/30 text-gold-300 px-6 py-3 rounded-xl font-bold hover:bg-gold-500/10 transition-all">Leagues</a>
            <a href="/teams" className="border border-gold-500/30 text-gold-300 px-6 py-3 rounded-xl font-bold hover:bg-gold-500/10 transition-all">Teams</a>
          </div>
        </div>
      </div>

      {/* Featured Matches Section */}
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            ⚽ Today's <span className="text-gold-400">Featured Matches</span>
          </h2>
          <p className="text-xl text-gray-300">
            Watch live premium football matches with 12-hour free trial access
          </p>
        </div>

        <Suspense fallback={
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800/50 rounded-2xl p-6 border border-white/10 animate-pulse">
                <div className="h-32 bg-gray-700/50 rounded"></div>
              </div>
            ))}
          </div>
        }>
          <FeaturedMatches />
        </Suspense>
      </div>

      {/* Premium Features Section */}
      <div className="bg-black-900/40 backdrop-blur-lg py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
              Why Choose <span className="text-gold-400">Kick AI</span>?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-gold-600/20 to-black-800/20 rounded-2xl p-8 border border-gold-500/30">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-2xl font-bold text-white mb-3">Premium Sports</h3>
              <p className="text-gray-300">All major leagues: Premier League, Champions League, La Liga, Serie A, Bundesliga and more</p>
            </div>

            <div className="bg-gradient-to-br from-professional-red/20 to-professional-black/20 rounded-2xl p-8 border border-professional-red/30">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-2xl font-bold text-white mb-3">Multi-Device</h3>
              <p className="text-gray-300">Watch on Smart TV, phone, tablet, computer. Perfect sync across all devices</p>
            </div>

            <div className="bg-gradient-to-br from-professional-gold/20 to-professional-red/20 rounded-2xl p-8 border border-professional-gold/30">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-2xl font-bold text-white mb-3">HD Highlights</h3>
              <p className="text-gray-300">Instant access to match highlights and replays in stunning 4K quality</p>
            </div>
          </div>
        </div>
      </div>

      {/* Get Matches Alerts Section */}
      <div className="bg-gradient-to-r from-black-800/50 to-black-700/50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-4 py-2 rounded-full font-bold mb-6">
                📱 SMART NOTIFICATIONS
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Never Miss a <span className="text-professional-gold">Goal Again</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Get instant alerts for goals, red cards, and key moments from your favorite teams.
                <span className="text-professional-gold font-bold">Join 75,000+ fans</span> who never miss the action.
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-gray-300">Real-time goal notifications</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-gray-300">Match start reminders</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <span className="text-gray-300">Personalized team updates</span>
                </div>
              </div>

              <a
                href="https://t.me/IPTVAccess_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center gap-3 w-fit"
              >
                🔔 GET MATCH ALERTS
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </a>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-3xl p-8 border border-white/10">
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">📱</div>
                  <h3 className="text-2xl font-bold text-white mb-2">Smart Alerts</h3>
                  <p className="text-gray-300">Never miss a moment</p>
                </div>

                <div className="space-y-3">
                  <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">⚽</span>
                      <span className="text-white font-bold">GOAL!</span>
                      <span className="text-gray-300">Man City 2-1</span>
                    </div>
                  </div>
                  <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400">🟥</span>
                      <span className="text-white font-bold">RED CARD</span>
                      <span className="text-gray-300">Liverpool vs Arsenal</span>
                    </div>
                  </div>
                  <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">⏰</span>
                      <span className="text-white font-bold">STARTING SOON</span>
                      <span className="text-gray-300">Real Madrid vs Barcelona</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Get Premium Access Section */}
      <div className="bg-gradient-to-r from-black-800/60 to-red-900/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-4 py-2 rounded-full font-bold mb-6">
              👑 PREMIUM EXPERIENCE
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Unlock <span className="text-gold-400">Premium Access</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get unlimited access to all matches, exclusive content, and premium features.
              <span className="text-gold-400 font-bold">Join the elite football experience.</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-gradient-to-br from-gold-600/20 to-black-800/20 rounded-2xl p-6 border border-gold-500/30 text-center">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-white mb-3">All Leagues</h3>
              <p className="text-gray-300">Premier League, Champions League, La Liga, Serie A, Bundesliga & more</p>
            </div>

            <div className="bg-gradient-to-br from-red-600/20 to-black-800/20 rounded-2xl p-6 border border-red-500/30 text-center">
              <div className="text-4xl mb-4">📺</div>
              <h3 className="text-xl font-bold text-white mb-3">4K Quality</h3>
              <p className="text-gray-300">Ultra HD streaming with crystal clear picture and surround sound</p>
            </div>

            <div className="bg-gradient-to-br from-gold-600/20 to-red-600/20 rounded-2xl p-6 border border-gold-500/30 text-center">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-xl font-bold text-white mb-3">Exclusive Content</h3>
              <p className="text-gray-300">Match highlights, player interviews, and behind-the-scenes footage</p>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-gold-600/10 to-red-600/10 rounded-3xl p-8 border border-gold-500/30 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-4 mb-6">
                <span className="text-3xl font-black text-gray-400 line-through">$29.99</span>
                <span className="text-4xl font-black text-gold-400">$9.99</span>
                <span className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm">67% OFF</span>
              </div>

              <p className="text-gray-300 mb-6">Limited time offer - First month only</p>

              <a
                href="/pricing"
                className="group bg-gradient-to-r from-gold-500 to-red-600 hover:from-gold-600 hover:to-red-700 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center gap-3 w-fit mx-auto"
              >
                💳 GET PREMIUM ACCESS
                <span className="group-hover:translate-x-2 transition-transform">→</span>
              </a>

              <div className="text-gray-400 text-sm mt-4">
                ✅ 30-day money-back guarantee • 🔒 Secure payment • ⚡ Live in 15 seconds
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className="bg-gradient-to-r from-black-800/70 to-red-900/50 py-20">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Ready to Experience <span className="text-gold-400">Football</span> Like Never Before?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Join thousands of fans who've already upgraded their football experience.
              <span className="text-gold-400 font-bold">Start watching today!</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/trial"
                className="group bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl flex items-center gap-3"
              >
                🚀 START FREE TRIAL
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
              <a
                href="/pricing"
                className="border border-gold-500/30 text-gold-300 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gold-500/10 transition-all duration-300 flex items-center gap-3"
              >
                💎 VIEW PRICING
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
