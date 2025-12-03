"use client"

import { useState, useEffect } from 'react'
import ClientOnly from './ClientOnly'

interface Notification {
  id: string
  type: 'signup' | 'watching' | 'discount' | 'stock'
  message: string
  location?: string
  time?: string
}

export default function SocialProofNotifications() {
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)

  const notifications: Notification[] = [
    {
      id: '1',
      type: 'signup',
      message: 'John from New York just upgraded to Premium',
      location: 'New York, NY',
      time: '2 minutes ago'
    },
    {
      id: '2',
      type: 'watching',
      message: 'Sarah from London is watching Premier League live',
      location: 'London, UK',
      time: '1 minute ago'
    },
    {
      id: '3',
      type: 'signup',
      message: 'Michael from Toronto upgraded to Premium',
      location: 'Toronto, CA',
      time: '3 minutes ago'
    },
    {
      id: '4',
      type: 'watching',
      message: 'Emma from Sydney is watching Champions League',
      location: 'Sydney, AU',
      time: '4 minutes ago'
    },
    {
      id: '5',
      type: 'discount',
      message: 'Ahmed from Dubai saved $240 with our special offer',
      location: 'Dubai, UAE',
      time: '2 minutes ago'
    },
    {
      id: '6',
      type: 'stock',
      message: 'Only 23 discount codes remaining today!',
      time: 'Just now'
    },
    {
      id: '7',
      type: 'signup',
      message: 'Carlos from Madrid just activated premium sports',
      location: 'Madrid, ES',
      time: '1 minute ago'
    },
    {
      id: '8',
      type: 'watching',
      message: '347 people are watching live sports right now',
      time: 'Live'
    }
  ]

  useEffect(() => {
    setMounted(true)

    const showNotification = () => {
      const randomNotification = notifications[Math.floor(Math.random() * notifications.length)]
      setCurrentNotification(randomNotification)
      setIsVisible(true)

      // Hide after 4 seconds
      setTimeout(() => {
        setIsVisible(false)
      }, 4000)

      // Clear notification after animation
      setTimeout(() => {
        setCurrentNotification(null)
      }, 5000)
    }

    // Show first notification after 3 seconds
    const initialTimeout = setTimeout(showNotification, 3000)

    // Then show random notifications every 8-15 seconds
    const interval = setInterval(() => {
      const randomDelay = Math.random() * 7000 + 8000 // 8-15 seconds
      setTimeout(showNotification, randomDelay)
    }, 15000)

    return () => {
      clearTimeout(initialTimeout)
      clearInterval(interval)
    }
  }, [])

  const getIcon = (type: string) => {
    switch (type) {
      case 'signup': return '🎯'
      case 'watching': return '📺'
      case 'discount': return '💰'
      case 'stock': return '⚠️'
      default: return '✨'
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'signup': return 'from-green-500 to-emerald-600'
      case 'watching': return 'from-blue-500 to-purple-600'
      case 'discount': return 'from-yellow-500 to-orange-600'
      case 'stock': return 'from-red-500 to-pink-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <ClientOnly>
      {mounted && currentNotification && (
        <div className={`fixed bottom-6 left-6 z-40 transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
          }`}>
          <div className={`bg-gradient-to-r ${getColor(currentNotification.type)} backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl max-w-sm`}>
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">
                {getIcon(currentNotification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight">
                  {currentNotification.message}
                </p>

                {currentNotification.location && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-white/80 text-xs">📍 {currentNotification.location}</span>
                  </div>
                )}

                {currentNotification.time && (
                  <p className="text-white/60 text-xs mt-1">
                    {currentNotification.time}
                  </p>
                )}
              </div>

              <button
                onClick={() => setIsVisible(false)}
                className="text-white/60 hover:text-white text-lg flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </ClientOnly>
  )
}
