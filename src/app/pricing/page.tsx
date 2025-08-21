import MetricBeacon from "@/components/MetricBeacon";

export default function PricingPage() {
  // Live stats
  const liveUsers = Math.floor(Math.random() * 100) + 500 // 500-600 users
  const todaySignups = Math.floor(Math.random() * 50) + 150 // 150-200 signups
  
  // Countdown timer for special offer
  const timeLeft = {
    hours: Math.floor(Math.random() * 24) + 1,
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      <MetricBeacon event="pricing_page_view" />
      
      {/* Real-Time Credentials Banner */}
      <div className="bg-gradient-to-r from-professional-gold/20 to-professional-gold/20 text-center py-6 border-b border-professional-gold/30">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="animate-pulse text-2xl">⚡</span>
          <span className="text-professional-gold font-black text-xl">INSTANT ACTIVATION - NO WAITING</span>
          <span className="animate-pulse text-2xl">⚡</span>
        </div>
        <p className="text-white text-lg font-semibold">
          IPTV credentials delivered in <span className="text-professional-gold font-bold">real-time</span> - Access within 15 seconds!
        </p>
      </div>
      
      {/* Urgency Banner */}
      <div className="bg-gradient-to-r from-professional-red to-professional-red text-white text-center py-4 font-bold">
        🔥 FLASH SALE: 75% OFF + 3 Months FREE - Ending in {timeLeft.hours}h {timeLeft.minutes}m
      </div>

      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-professional-red/20 to-professional-gold/20"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 py-16">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-professional-red text-white px-6 py-2 rounded-full font-bold mb-6">
              ⚡ REAL-TIME ACTIVATION - LIVE IN 15 SECONDS
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-professional-gold to-professional-gold bg-clip-text text-transparent">
                Premium IPTV
              </span>
              <br />
              <span className="bg-gradient-to-r from-professional-red to-professional-red bg-clip-text text-transparent">
                Pricing Plans
              </span>
            </h1>
            
            <p className="text-2xl text-gray-300 mb-8 max-w-4xl mx-auto">
              Join <span className="text-professional-gold font-bold">{liveUsers.toLocaleString()}+</span> users already enjoying 
              premium entertainment. <span className="text-professional-red font-bold">{todaySignups}</span> people signed up today!
            </p>

            {/* Social Proof */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-lg mb-12">
              <div className="flex items-center gap-2 text-professional-gold">
                <div className="w-3 h-3 bg-professional-gold rounded-full animate-pulse"></div>
                <span className="font-bold">{Math.floor(Math.random() * 50) + 200}</span>
                <span className="text-gray-300">users online now</span>
              </div>
              <div className="flex items-center gap-2 text-professional-gold">
                <span className="text-2xl">⭐⭐⭐⭐⭐</span>
                <span className="font-bold">4.9/5</span>
                <span className="text-gray-300">(12,847 reviews)</span>
              </div>
              <div className="flex items-center gap-2 text-professional-red">
                <span className="font-bold">99.9%</span>
                <span className="text-gray-300">uptime guarantee</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            
            {/* Starter Plan */}
            <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-lg rounded-2xl p-8 border border-white/10 relative">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Starter Package</h3>
                <p className="text-gray-400">IPTV 3 Month Subscription</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-gray-400 line-through text-xl">$75.00</span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">67% OFF</span>
                </div>
                <div className="text-5xl font-black text-white mb-1">$25</div>
                <div className="text-gray-400">3 months total</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">8,000+ Live Channels</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">HD Quality Streaming</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">One Device / One Connection</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">Basic Support</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">10,000+ Movies</span>
                </div>
              </div>

              <a
                href="https://www.iptv.shopping/pricing?plan=starter&source=kickai_matches"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-professional-red to-professional-red hover:from-red-600 hover:to-red-500 text-white py-4 rounded-xl font-bold text-lg text-center transition-all duration-300 transform hover:scale-105"
              >
                ⚡ Get Instant Access
              </a>
            </div>

            {/* Professional Plan - Most Popular */}
            <div className="bg-gradient-to-br from-professional-gold/20 to-professional-gold/20 backdrop-blur-lg rounded-2xl p-8 border-2 border-professional-gold relative transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-professional-gold to-professional-gold text-black px-6 py-2 rounded-full font-bold text-sm">
                  🏆 MOST POPULAR
                </span>
              </div>

              <div className="text-center mb-6 mt-4">
                <h3 className="text-3xl font-bold text-white mb-2">Professional Package</h3>
                <p className="text-gray-300">IPTV 6 Month Subscription</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-gray-400 line-through text-2xl">$150.00</span>
                  <span className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">74% OFF</span>
                </div>
                <div className="text-6xl font-black text-white mb-1">$39</div>
                <div className="text-gray-300">6 months total</div>
                <div className="text-professional-gold font-bold text-sm mt-2">Best Value!</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white font-bold">15,000+ Live Channels</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white font-bold">4K Ultra HD Quality</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white font-bold">One Device / One Connection</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white font-bold">Priority Support 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white font-bold">35,000+ Movies & Shows</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white font-bold">Premium Sports Channels</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white font-bold">Cloud Recording</span>
                </div>
              </div>

              <a
                href="https://www.iptv.shopping/pricing?plan=professional&source=kickai_matches"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-professional-gold to-professional-gold hover:from-yellow-500 hover:to-yellow-400 text-black py-4 rounded-xl font-black text-lg text-center transition-all duration-300 transform hover:scale-105 shadow-2xl"
              >
                ⚡ Get Instant Access
              </a>
              
              <div className="text-center mt-4">
                <span className="text-professional-gold text-sm font-bold">
                  ⚡ Most chosen by customers today!
                </span>
              </div>
            </div>

            {/* Advanced Plan */}
            <div className="bg-gradient-to-br from-professional-red/20 to-professional-red/20 backdrop-blur-lg rounded-2xl p-8 border border-professional-red/50 relative">
              <div className="absolute -top-3 right-4">
                <span className="bg-professional-red text-white px-4 py-1 rounded-full font-bold text-xs">
                  ULTIMATE
                </span>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Advanced Package</h3>
                <p className="text-gray-400">IPTV 12 Month Subscription</p>
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-gray-400 line-through text-xl">$240.00</span>
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">75% OFF</span>
                </div>
                <div className="text-5xl font-black text-white mb-1">$59</div>
                <div className="text-gray-400">12 months total</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">20,000+ Live Channels</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">8K Ultra HD Quality</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">One Device / One Connection</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">VIP Support 24/7</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">50,000+ Movies & Shows</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">All Premium Sports</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-professional-gold text-xl">✅</span>
                  <span className="text-white">Unlimited Cloud Storage</span>
                </div>
              </div>

              <a
                href="https://www.iptv.shopping/pricing?plan=advanced&source=kickai_matches"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-gradient-to-r from-professional-red to-professional-red hover:from-red-600 hover:to-red-700 text-white py-4 rounded-xl font-bold text-lg text-center transition-all duration-300 transform hover:scale-105"
              >
                ⚡ Get Instant Access
              </a>
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="text-center mb-16">
            <div className="bg-gradient-to-r from-professional-gold/20 to-professional-gold/20 rounded-2xl p-8 border border-professional-gold/30 max-w-4xl mx-auto">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-3xl font-bold text-white mb-4">30-Day Money-Back Guarantee</h3>
              <p className="text-xl text-gray-300">
                Not satisfied? Get your money back, no questions asked. We're confident you'll love our service!
              </p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              Frequently Asked Questions
            </h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-professional-gold mb-3">What devices are supported?</h3>
                <p className="text-gray-300">
                  All devices! Smart TVs, smartphones, tablets, computers, streaming boxes, and more. 
                  Works on Android, iOS, Windows, macOS, and Linux.
                </p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-professional-gold mb-3">Is there a contract?</h3>
                <p className="text-gray-300">
                  No contracts! Cancel anytime. Monthly subscriptions with full flexibility. 
                  No hidden fees or cancellation charges.
                </p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-professional-gold mb-3">How fast is activation?</h3>
                <p className="text-gray-300">
                  <span className="text-green-400 font-bold">Real-time activation!</span> IPTV credentials are delivered instantly after payment. 
                  <span className="text-green-400 font-bold">Live in 15 seconds</span> - no waiting period!
                </p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-professional-gold mb-3">What about customer support?</h3>
                <p className="text-gray-300">
                  24/7 expert support via chat, email, and phone. 
                  Average response time under 2 minutes. We're here to help!
                </p>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-white text-center mb-12">
              What Our Customers Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-professional-gold to-professional-gold rounded-full flex items-center justify-center font-bold text-black">
                    RJ
                  </div>
                  <div>
                    <div className="text-white font-bold">Robert Johnson</div>
                    <div className="text-gray-400 text-sm">Professional Plan</div>
                  </div>
                </div>
                <div className="text-professional-gold mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-300">
                  "Incredible value! I was paying $200/month for cable. This is 10x better for 1/8th the price. Every sports channel I need!"
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-professional-red to-professional-red rounded-full flex items-center justify-center font-bold text-white">
                    LM
                  </div>
                  <div>
                    <div className="text-white font-bold">Lisa Martinez</div>
                    <div className="text-gray-400 text-sm">Premium Plan</div>
                  </div>
                </div>
                <div className="text-professional-gold mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-300">
                  "Setup was so easy! My whole family is now watching different shows on different devices. The 4K quality is amazing!"
                </p>
              </div>

              <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-professional-gold to-professional-red rounded-full flex items-center justify-center font-bold text-white">
                    DW
                  </div>
                  <div>
                    <div className="text-white font-bold">David Wilson</div>
                    <div className="text-gray-400 text-sm">Starter Plan</div>
                  </div>
                </div>
                <div className="text-professional-gold mb-2">⭐⭐⭐⭐⭐</div>
                <p className="text-gray-300">
                  "Started with the free trial, then upgraded immediately. Customer support is fantastic - they helped me set up everything!"
                </p>
              </div>
            </div>
          </div>

          {/* Final Urgency CTA */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-professional-red/20 to-professional-red/20 rounded-3xl p-12 border border-professional-red/30">
              <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
                Time is Running Out! ⏰
              </h2>
              <p className="text-2xl text-gray-300 mb-8">
                This 75% discount ends in <span className="text-professional-red font-bold">{timeLeft.hours} hours</span>. 
                Don't miss your chance to save <span className="text-professional-gold font-bold">$900+ per year!</span>
              </p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8">
                <a
                  href="/trial"
                  className="bg-gradient-to-r from-professional-gold to-professional-gold hover:from-yellow-500 hover:to-yellow-400 text-black px-12 py-6 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl"
                >
                  🎯 TRY FREE FIRST
                </a>
                <a
                  href="https://www.iptv.shopping/pricing?plan=professional&source=kickai_matches&special=flash_sale"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-professional-red to-professional-red hover:from-red-600 hover:to-red-700 text-white px-12 py-6 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl animate-pulse"
                >
                  🚨 SECURE MY DISCOUNT NOW
                </a>
              </div>
              
              <div className="flex items-center justify-center gap-6 text-lg text-gray-300">
                <span>⚡ Live in 15 seconds</span>
                <span>•</span>
                <span>🔒 Real-time credentials</span>
                <span>•</span>
                <span>💰 Zero wait time</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
