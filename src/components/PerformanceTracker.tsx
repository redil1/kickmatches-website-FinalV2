"use client"

import { useEffect } from 'react'

export default function PerformanceTracker() {
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    const trackPageLoad = () => {
      try {
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart
        
        // Track with gtag if available
        if (typeof (window as any).gtag === 'function' && loadTime > 0) {
          ;(window as any).gtag('event', 'page_load_time', {
            event_category: 'Performance',
            value: Math.round(loadTime)
          })
        }
        
        // Also track to our metrics API
        if (loadTime > 0) {
          fetch('/api/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'page_performance',
              payload: {
                load_time: Math.round(loadTime),
                page: window.location.pathname,
                timestamp: new Date().toISOString()
              }
            })
          }).catch(() => {
            // Ignore metrics errors
          })
        }
      } catch (error) {
        console.warn('Performance tracking error:', error)
      }
    }

    // Track when page is fully loaded
    if (document.readyState === 'complete') {
      trackPageLoad()
    } else {
      window.addEventListener('load', trackPageLoad)
      return () => window.removeEventListener('load', trackPageLoad)
    }
  }, [])

  // This component renders nothing
  return null
}
