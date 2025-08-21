"use client"

import { useState, useEffect, useCallback } from 'react'

export function useNotificationPermission() {
  const [mounted, setMounted] = useState(false)
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [hasSubscription, setHasSubscription] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check initial state
  useEffect(() => {
    setMounted(true)
    
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      setPermission(Notification.permission)
      
      // Check for existing subscription
      navigator.serviceWorker.ready.then(registration => {
        return registration.pushManager.getSubscription()
      }).then(subscription => {
        setHasSubscription(!!subscription)
      }).catch(() => {
        // Service worker not ready or no subscription
        setHasSubscription(false)
      })
    }
  }, [])

  // Check if user has granted permission and has active subscription
  const isNotificationEnabled = mounted && supported && permission === 'granted' && hasSubscription

  // Request permission and subscribe
  const enableNotifications = useCallback(async () => {
    if (!supported || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      throw new Error('Notifications not supported')
    }
    
    setLoading(true)
    
    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      
      await navigator.serviceWorker.ready
      
      // Request permission
      const newPermission = await Notification.requestPermission()
      setPermission(newPermission)
      
      if (newPermission !== 'granted') {
        throw new Error('Notification permission denied')
      }
      
      // Convert VAPID key
      const padding = '='.repeat((4 - (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY.length % 4)) % 4)
      const base64 = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY + padding).replace(/-/g, '+').replace(/_/g, '/')
      const rawData = atob(base64)
      const applicationServerKey = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        applicationServerKey[i] = rawData.charCodeAt(i)
      }
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      })
      
      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })
      
      if (!response.ok) {
        throw new Error('Failed to register subscription with server')
      }
      
      setHasSubscription(true)
      return true
    } catch (error) {
      console.error('Failed to enable notifications:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [supported])

  // Check subscription status
  const checkSubscription = useCallback(async () => {
    if (!supported) return false
    
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      const hasActive = !!subscription
      setHasSubscription(hasActive)
      return hasActive
    } catch {
      return false
    }
  }, [supported])

  return {
    mounted,
    supported,
    permission,
    hasSubscription,
    loading,
    isNotificationEnabled,
    enableNotifications,
    checkSubscription
  }
}