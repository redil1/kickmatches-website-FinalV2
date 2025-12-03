"use client"

import { useState, useEffect } from 'react'

export default function StickyConversionBar() {
  const [isVisible, setIsVisible] = useState(false)
  const [timeLeft, setTimeLeft] = useState({
    hours: Math.floor(Math.random() * 12) + 1,
    minutes: Math.floor(Math.random() * 60),
    seconds: Math.floor(Math.random() * 60)
  })

  useEffect(() => {
    // Show bar after 10 seconds of page load
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 10000)

    // Update countdown every second
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 }
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 }
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 }
        }
        return prev
      })
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(countdownInterval)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 transform transition-transform duration-500 ease-in-out">
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-2xl border-t-2 border-yellow-400">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Left side - Offer text */}
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="text-2xl animate-pulse">🔥</div>
              <div>
                <div className="font-black text-lg md:text-xl">
                  LIMITED TIME: 75% OFF + 3 Months FREE!
                </div>
                <div className="text-sm text-pink-100">
                  Don't miss this exclusive offer - ending soon!
                </div>
              </div>
            </div>

            {/* Center - Countdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">ENDS IN:</span>
              <div className="flex gap-1 font-mono font-bold">
                <span className="bg-black/30 px-2 py-1 rounded">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/30 px-2 py-1 rounded">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </span>
                <span>:</span>
                <span className="bg-black/30 px-2 py-1 rounded">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Right side - CTA buttons */}
            <div className="flex items-center gap-3">

              <a
                href="/pricing"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-2 rounded-xl font-bold text-sm transition-all duration-300 border border-white/30"
              >
                💳 CLAIM DISCOUNT
              </a>
              <button
                onClick={() => setIsVisible(false)}
                className="text-white/70 hover:text-white text-xl ml-2"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
