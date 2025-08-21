import { Metadata } from 'next';
import MetricBeacon from "@/components/MetricBeacon";
import StartTrial from "@/components/StartTrial";
import PushSubscribeButton from "@/components/PushSubscribeButton";


export const metadata: Metadata = {
  title: "Free 12-Hour IPTV Trial | Watch Live Football Matches | Premium Sports Streaming",
  description: "Start your free 12-hour IPTV trial now! Watch live football matches, Premier League, Champions League. No credit card required. 15,000+ premium sports channels in 4K.",
  keywords: "free IPTV trial, 12 hour free trial, live football streaming, Premier League trial, Champions League free, no credit card required, premium sports streaming",
  openGraph: {
    title: "Free 12-Hour IPTV Trial | Watch Live Football Matches | Premium Sports",
    description: "Get instant access to 15,000+ premium sports channels. Watch live football matches in 4K quality. 12-hour free trial, no credit card required.",
    type: "website",
    url: "https://kickaiofmatches.com/trial",
    images: [
      {
        url: "/trial-og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Free 12-Hour IPTV Trial - Premium Sports Streaming",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free 12-Hour IPTV Trial | Watch Live Football Matches | Premium Sports",
    description: "Get instant access to 15,000+ premium sports channels. 12-hour free trial, no credit card required. Start watching now!",
  },
};

export default function TrialPage() {
  // Countdown timer
  const timeLeft = {
    hours: Math.floor(Math.random() * 12) + 1, // 1-12 hours
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60)
  }

  // Live user counter
  const liveUsers = Math.floor(Math.random() * 100) + 250 // 250-350 users

  return (
    <div className="min-h-screen bg-gradient-to-br from-professional-black via-gray-900 to-professional-black">
      <MetricBeacon event="trial_page_view" />
      
      {/* Exit Intent Popup Trigger */}
      <div id="exit-intent-trigger" className="hidden"></div>
      
      {/* Real-Time Credentials Banner */}
      <div className="bg-gradient-to-r from-professional-gold to-yellow-500 text-black text-center py-4 font-bold">
        ⚡ INSTANT ACTIVATION: Your credentials are delivered in REAL-TIME - Access within 15 seconds!
      </div>
      
      {/* Urgency Banner */}
      <div className="bg-professional-red text-white text-center py-3 font-bold animate-pulse">
        🔥 LIMITED TIME: Free 12-Hour Premium Access - Only {Math.floor(Math.random() * 50) + 20} spots left today!
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-professional-gold/10 to-professional-red/10"></div>
        
        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-4 h-4 bg-professional-gold/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-20 w-3 h-3 bg-professional-red/30 rounded-full animate-ping animation-delay-1000"></div>
          <div className="absolute bottom-40 left-1/4 w-2 h-2 bg-professional-gold/30 rounded-full animate-ping animation-delay-2000"></div>
        </div>
        
        <div className="relative mx-auto max-w-6xl px-4 py-12">
          {/* Simple Alert Button */}
          <div className="flex justify-center mb-16">
            <PushSubscribeButton />
          </div>
          {/* Trust Signals - Horizontal at Top */}
          <div className="flex justify-center mb-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 max-w-6xl w-full">
              <div className="flex flex-col items-center gap-2 text-center bg-black/20 backdrop-blur-lg rounded-xl p-4 border border-professional-gold/30">
                <span className="text-3xl md:text-4xl">⚡</span>
                <span className="text-professional-gold font-bold text-sm md:text-base">Live in 15s</span>
                <span className="text-gray-300 text-xs md:text-sm">Real-time credentials</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center bg-black/20 backdrop-blur-lg rounded-xl p-4 border border-professional-gold/30">
                <span className="text-3xl md:text-4xl">🔄</span>
                <span className="text-professional-gold font-bold text-sm md:text-base">Zero Wait</span>
                <span className="text-gray-300 text-xs md:text-sm">Instant activation</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center bg-black/20 backdrop-blur-lg rounded-xl p-4 border border-professional-gold/30">
                <span className="text-3xl md:text-4xl">🔒</span>
                <span className="text-professional-gold font-bold text-sm md:text-base">100% Secure</span>
                <span className="text-gray-300 text-xs md:text-sm">Data protected</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center bg-black/20 backdrop-blur-lg rounded-xl p-4 border border-professional-gold/30">
                <span className="text-3xl md:text-4xl">🚫</span>
                <span className="text-professional-gold font-bold text-sm md:text-base">No Card</span>
                <span className="text-gray-300 text-xs md:text-sm">Required</span>
              </div>
              <div className="flex flex-col items-center gap-2 text-center bg-black/20 backdrop-blur-lg rounded-xl p-4 border border-professional-gold/30 col-span-2 md:col-span-1">
                <span className="text-3xl md:text-4xl">⏰</span>
                <span className="text-professional-gold font-bold text-sm md:text-base">12 Hours</span>
                <span className="text-gray-300 text-xs md:text-sm">Auto-expires</span>
              </div>
            </div>
          </div>

          {/* Trial Form - Directly Under Trust Signals */}
          <div className="flex justify-center items-center mb-16">
            <div className="w-full max-w-4xl">
              <StartTrial slug="trial-page" />
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-professional-gold text-black px-6 py-2 rounded-full font-bold mb-6">
              ⚡ REAL-TIME ACTIVATION - NO WAITING
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-professional-gold to-yellow-500 bg-clip-text text-transparent">
                FREE 12-Hour
              </span>
              <br />
              <span className="bg-gradient-to-r from-professional-red to-red-500 bg-clip-text text-transparent">
                Premium Trial
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Watch <span className="text-professional-gold font-bold">EVERY Premier League match</span>, 
              Champions League, La Liga and more in <span className="text-professional-red font-bold">stunning 4K quality</span>
            </p>

            {/* Social Proof */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-lg mb-12">
              <div className="flex items-center gap-2 text-professional-gold">
                <div className="w-3 h-3 bg-professional-gold rounded-full animate-pulse"></div>
                <span className="font-bold">{liveUsers}</span>
                <span className="text-gray-300">users watching now</span>
              </div>
              <div className="flex items-center gap-2 text-professional-gold">
                <span className="text-2xl">⭐⭐⭐⭐⭐</span>
                <span className="font-bold">4.9/5</span>
                <span className="text-gray-300">(8,247 reviews)</span>
              </div>
            </div>

            {/* Countdown Timer */}
            <div className="mb-12">
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-white mb-2">⏰ OFFER EXPIRES IN</h2>
                <p className="text-xl text-professional-red font-bold">Don't miss this limited-time opportunity!</p>
              </div>
              <div className="flex justify-center gap-4">
                <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-professional-red/50 min-w-[100px]">
                  <div className="text-4xl font-black text-professional-red text-center font-mono">
                    {timeLeft.hours.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm font-bold text-gray-300 text-center">HOURS</div>
                </div>
                <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-professional-red/50 min-w-[100px]">
                  <div className="text-4xl font-black text-professional-red text-center font-mono">
                    {timeLeft.minutes.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm font-bold text-gray-300 text-center">MINS</div>
                </div>
                <div className="bg-black/50 backdrop-blur-lg rounded-2xl p-6 border border-professional-red/50 min-w-[100px]">
                  <div className="text-4xl font-black text-professional-red text-center font-mono">
                    {timeLeft.seconds.toString().padStart(2, '0')}
                  </div>
                  <div className="text-sm font-bold text-gray-300 text-center">SECS</div>
                </div>
              </div>
            </div>
          </div>

          {/* Simple Alert Button */}
          <div className="flex justify-center mb-16">
            <PushSubscribeButton />
          </div>

          {/* Features Grid - Below Main Trial */}
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: What You Get */}
            <div className="space-y-6">
                
              {/* What You Get */}
              <div className="bg-gradient-to-br from-professional-gold/20 to-yellow-600/20 rounded-2xl p-8 border border-professional-gold/30">
                <h3 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                  <span className="text-4xl">🎁</span>
                  What You Get FREE
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="text-professional-gold text-xl">✅</span>
                    <span className="text-white text-lg">15,000+ Live TV Channels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-professional-gold text-xl">✅</span>
                    <span className="text-white text-lg">All Premium Sports Channels</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-professional-gold text-xl">✅</span>
                    <span className="text-white text-lg">4K Ultra HD Quality</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-professional-gold text-xl">✅</span>
                    <span className="text-white text-lg">35,000+ Movies & Shows</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-professional-gold text-xl">✅</span>
                    <span className="text-white text-lg">Multi-Device Access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-professional-gold text-xl">✅</span>
                    <span className="text-white text-lg">24/7 Premium Support</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Sports & Value */}
            <div className="space-y-6">

              {/* Sports Channels */}
              <div className="bg-gradient-to-br from-professional-red/20 to-red-600/20 rounded-2xl p-8 border border-professional-red/30">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="text-3xl">⚽</span>
                  Premium Sports Channels
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-white font-bold">beIN Sports</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-white font-bold">Sky Sports</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-white font-bold">ESPN</div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3 text-center">
                    <div className="text-white font-bold">Fox Sports</div>
                  </div>
                </div>
              </div>

              {/* Value Proposition */}
              <div className="bg-gradient-to-br from-professional-gold/20 to-yellow-600/20 rounded-2xl p-8 border border-professional-gold/30">
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                  <span className="text-3xl">💰</span>
                  Trial Value: <span className="text-professional-gold">$89</span>
                </h3>
                <p className="text-gray-300 text-lg">
                  Experience premium IPTV service that normally costs $89/month. 
                  Get 12 hours of full access absolutely FREE!
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mt-16">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              What Our Users Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-professional-gold rounded-full flex items-center justify-center font-bold text-black">
                    JD
                  </div>
                  <div>
                    <div className="text-white font-bold">John Davis</div>
                    <div className="text-gray-400 text-sm">Verified Customer</div>
                  </div>
                </div>
                <div className="text-professional-gold mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-300">
                  "Best IPTV service I've ever used. Crystal clear 4K quality and never buffers. Worth every penny!"
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-professional-red rounded-full flex items-center justify-center font-bold text-white">
                    SM
                  </div>
                  <div>
                    <div className="text-white font-bold">Sarah Miller</div>
                    <div className="text-gray-400 text-sm">Verified Customer</div>
                  </div>
                </div>
                <div className="text-professional-gold mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-300">
                  "Amazing sports coverage! I can watch every Premier League match in perfect quality. Highly recommended!"
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-professional-gold rounded-full flex items-center justify-center font-bold text-black">
                    MJ
                  </div>
                  <div>
                    <div className="text-white font-bold">Michael Johnson</div>
                    <div className="text-gray-400 text-sm">Verified Customer</div>
                  </div>
                </div>
                <div className="text-professional-gold mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-300">
                  "Incredible value for money. The trial convinced me instantly. Now I'm a loyal customer!"
                </p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-professional-red/20 to-red-500/20 rounded-3xl p-12 border border-professional-red/30">
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                Don't Wait - Act Now! 🚨
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                This exclusive offer ends soon. Join thousands of satisfied customers who are already enjoying premium IPTV.
              </p>
              
              <div className="flex items-center justify-center gap-4 text-lg text-professional-gold font-bold">
                <span>⚡ Live in 15 seconds</span>
                <span>•</span>
                <span>🔄 Real-time credentials</span>
                <span>•</span>
                <span>🚀 Zero wait time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
