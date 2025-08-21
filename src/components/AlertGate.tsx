"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Bell, Shield, Zap, Star, Users, Clock, AlertTriangle, RefreshCw, Settings, Chrome, CheckCircle, Info } from 'lucide-react'

// Custom SVG icons for browsers not available in lucide-react
const Firefox = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6.5 12c0 3.59-2.91 6.5-6.5 6.5S5.5 15.59 5.5 12 8.41 5.5 12 5.5s6.5 2.91 6.5 6.5z"/>
    <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z"/>
    <circle cx="12" cy="12" r="4" fill="#FF7139"/>
  </svg>
)

const Safari = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <path d="M8 8l8 8M16 8l-8 8" stroke="#007AFF" strokeWidth="1" opacity="0.6"/>
  </svg>
)
import ClientOnly from './ClientOnly'

interface AlertGateProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showBenefits?: boolean
  onSubscriptionChange?: (hasSubscription: boolean) => void
}

type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other'

interface BrowserGuide {
  name: string
  icon: React.ComponentType<{ className?: string }>
  steps: string[]
}

const BROWSER_GUIDES: Record<BrowserType, BrowserGuide> = {
  chrome: {
    name: 'Chrome',
    icon: Chrome,
    steps: [
      'Click the lock icon in the address bar',
      'Select "Notifications" from the dropdown',
      'Choose "Allow" for notifications',
      'Refresh the page and try again'
    ]
  },
  firefox: {
    name: 'Firefox',
    icon: Firefox,
    steps: [
      'Click the shield icon in the address bar',
      'Click "Turn off Blocking for This Site"',
      'Or go to Settings > Privacy & Security > Permissions',
      'Find this site and change notifications to "Allow"'
    ]
  },
  safari: {
    name: 'Safari',
    icon: Safari,
    steps: [
      'Go to Safari > Preferences > Websites',
      'Click "Notifications" in the left sidebar',
      'Find this website and change to "Allow"',
      'Refresh the page and try again'
    ]
  },
  edge: {
    name: 'Edge',
    icon: Settings,
    steps: [
      'Click the lock icon in the address bar',
      'Select "Permissions for this site"',
      'Change "Notifications" to "Allow"',
      'Refresh the page and try again'
    ]
  },
  other: {
    name: 'Your Browser',
    icon: Settings,
    steps: [
      'Look for a lock or settings icon in your address bar',
      'Find notification settings for this site',
      'Change notifications from "Block" to "Allow"',
      'Refresh the page and try again'
    ]
  }
};

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

export default function AlertGate({ children, title, subtitle, showBenefits = true }: AlertGateProps) {
  const [mounted, setMounted] = useState(false)
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribing, setSubscribing] = useState(false)
  const [hasSubscription, setHasSubscription] = useState(false)
  const [showBrowserGuide, setShowBrowserGuide] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const [browser, setBrowser] = useState<BrowserType>('other')
  const [isRetrying, setIsRetrying] = useState(false)
  const [testNotificationSent, setTestNotificationSent] = useState(false)

  // Detect browser type
  const detectBrowser = (): BrowserType => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return 'safari';
    if (userAgent.includes('edg')) return 'edge';
    return 'other';
  };

  // Test notification function
  const sendTestNotification = async () => {
    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification('Test Notification', {
          body: 'Great! Notifications are working correctly.',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
        
        setTimeout(() => notification.close(), 5000);
        setTestNotificationSent(true);
        setTimeout(() => setTestNotificationSent(false), 3000);
      } catch (err) {
        console.error('Test notification failed:', err);
        setLastError('Test notification failed');
      }
    }
  };

  // Enhanced retry mechanism with multiple strategies
  const handleRetryPermission = async () => {
    setIsRetrying(true);
    setLastError(null);
    
    const strategies = [
      // Strategy 1: Direct permission request
      async () => {
        const result = await Notification.requestPermission();
        return result;
      },
      
      // Strategy 2: Request with user interaction context
      async () => {
        return new Promise<NotificationPermission>((resolve) => {
          const button = document.createElement('button');
          button.style.display = 'none';
          document.body.appendChild(button);
          
          button.onclick = async () => {
            const result = await Notification.requestPermission();
            document.body.removeChild(button);
            resolve(result);
          };
          
          button.click();
        });
      },
      
      // Strategy 3: Delayed request (sometimes helps with browser restrictions)
      async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const result = await Notification.requestPermission();
        return result;
      }
    ];
    
    for (let i = 0; i < strategies.length; i++) {
      try {
        const result = await strategies[i]();
        setPermission(result);
        
        if (result === 'granted') {
          setRetryCount(0);
          setIsRetrying(false);
          // Proceed with enabling alerts
          await handleEnableAlerts();
          return;
        }
      } catch (err) {
        console.error(`Strategy ${i + 1} failed:`, err);
        setLastError(`Strategy ${i + 1} failed: ${err}`);
      }
      
      // Wait between strategies
      if (i < strategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setRetryCount(prev => prev + 1);
    setIsRetrying(false);
    setShowBrowserGuide(true);
  };

  // Check notification permission and subscription status
  useEffect(() => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    // Server-side vs Client-side environment variable check
    console.log('=== AlertGate Environment Debug ===')
    console.log('AlertGate: typeof window:', typeof window)
    console.log('AlertGate: Server-side VAPID key:', vapidKey)
    console.log('AlertGate: Client-side VAPID key:', typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY : 'N/A (server-side)')
    
    console.log('AlertGate: Component mounted')
    setMounted(true)
    setBrowser(detectBrowser())
    
    console.log('AlertGate: Checking browser support...')
    console.log('AlertGate: serviceWorker in navigator:', 'serviceWorker' in navigator)
    console.log('AlertGate: PushManager in window:', 'PushManager' in window)
    
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      console.log('AlertGate: Browser supports notifications')
      setSupported(true)
      setPermission(Notification.permission)
      console.log('AlertGate: Current permission:', Notification.permission)
      
      // Check if user already has an active subscription
      navigator.serviceWorker.ready.then(registration => {
        console.log('AlertGate: Service worker ready')
        registration.pushManager.getSubscription().then(subscription => {
          console.log('AlertGate: Existing subscription:', !!subscription)
          setHasSubscription(!!subscription)
        })
      }).catch((error) => {
        console.log('AlertGate: Service worker not ready:', error)
      })
    } else {
      console.log('AlertGate: Browser does not support notifications')
    }
  }, [])

  const handleEnableAlerts = useCallback(async () => {
    alert('Button clicked!')
    console.log('=== AlertGate: Button clicked! ===')
    console.log('AlertGate: Current state - supported:', supported)
    console.log('AlertGate: Current state - permission:', permission)
    console.log('AlertGate: Current state - subscribing:', subscribing)
    console.log('AlertGate: Current state - hasSubscription:', hasSubscription)
    console.log('AlertGate: VAPID Key present:', !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    console.log('AlertGate: VAPID Key value:', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    
    if (!supported) {
      console.log('AlertGate: Early return - browser not supported')
      return
    }
    
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.log('AlertGate: Early return - no VAPID key')
      return
    }
    
    console.log('AlertGate: Starting subscription process...')
    
    try {
      console.log('AlertGate: Setting subscribing to true')
      setSubscribing(true)
      
      console.log('AlertGate: Registering service worker...')
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
      console.log('AlertGate: Service worker registered:', registration)
      
      console.log('AlertGate: Waiting for service worker ready...')
      await navigator.serviceWorker.ready
      console.log('AlertGate: Service worker ready')
      
      console.log('AlertGate: Requesting notification permission...')
      // Request notification permission
      const newPermission = await Notification.requestPermission()
      console.log('AlertGate: Permission result:', newPermission)
      setPermission(newPermission)
      
      if (newPermission !== 'granted') {
        throw new Error('Notification permission denied')
      }
      
      console.log('AlertGate: Creating push subscription...')
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
      })
      console.log('AlertGate: Push subscription created:', subscription)
      
      console.log('AlertGate: Sending subscription to server...')
      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      })
      console.log('AlertGate: Server response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }
      
      console.log('AlertGate: Subscription successful!')
      setHasSubscription(true)
      
      // Send a test notification
      setTimeout(() => sendTestNotification(), 1000);
    } catch (error) {
      console.error('AlertGate: Failed to enable alerts:', error)
      setLastError(error instanceof Error ? error.message : 'Failed to enable alerts');
    } finally {
      console.log('AlertGate: Setting subscribing to false')
      setSubscribing(false)
    }
  }, [supported, permission, subscribing, hasSubscription])

  // Always render children first (trial content), then optional notification setup
  return (
    <>
      {children}
      <NotificationSetupSection />
    </>
  );

  function NotificationSetupSection() {
    // Don't show notification setup if already enabled
    if (permission === 'granted' && hasSubscription) {
      return null;
    }

    return (
      <ClientOnly fallback={
        <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-600 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-600 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      }>
        <div></div>
      </ClientOnly>
    );
  }
}