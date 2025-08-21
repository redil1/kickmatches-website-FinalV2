"use client"

import { useCallback, useEffect, useState } from 'react'
import ClientOnly from './ClientOnly'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function PushSubscribeButton() {
  const [supported, setSupported] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSupported('serviceWorker' in navigator && 'PushManager' in window)
  }, [])

  const onSubscribe = useCallback(async () => {
    if (!supported) return
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return
    
    try {
      setSubscribing(true)
      
      // Check if we're in a secure context
      if (!window.isSecureContext) {
        throw new Error('Push notifications require a secure context (HTTPS)')
      }
      
      // Register service worker with error handling
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      }).catch((error) => {
        console.warn('Service Worker registration failed:', error)
        throw new Error('Service Worker registration failed')
      })
      
      await navigator.serviceWorker.ready
      
      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        throw new Error('Notification permission denied')
      }
      
      // Subscribe to push notifications
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      }).catch((error) => {
        console.warn('Push subscription failed:', error)
        throw new Error('Push subscription failed')
      })
      
      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub)
      }).catch((error) => {
        console.warn('Failed to send subscription to server:', error)
        // Don't throw here, subscription might still work locally
        return { ok: true }
      })
      
      if (response.ok) {
        setSubscribed(true)
      } else {
        throw new Error('Failed to register subscription with server')
      }
    } catch (e) {
      console.error('Push notification setup failed:', e)
      setSubscribed(false)
      // Optional: Show user-friendly error message
      if (e instanceof Error) {
        console.log('Error details:', e.message)
      }
    } finally {
      setSubscribing(false)
    }
  }, [supported])

  return (
    <ClientOnly fallback={
      <div className="bg-gray-600 rounded-xl px-8 py-4 text-white font-bold text-lg flex items-center gap-2 opacity-50">
        <span className="text-xl">🔔</span>
        <span>Loading...</span>
      </div>
    }>
      {!mounted || !supported ? null : subscribed ? (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl px-6 py-3 text-white font-semibold flex items-center gap-2 shadow-lg">
          <span className="text-xl">✅</span>
          <span>Alerts Active</span>
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        </div>
      ) : (
        <button
          onClick={onSubscribe}
          disabled={subscribing}
          className="group bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
        >
          {subscribing ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Enabling...</span>
            </>
          ) : (
            <>
              <span className="text-xl">🔔</span>
              <span>Get Match Alerts</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </>
          )}
        </button>
      )}
    </ClientOnly>
  )
}


