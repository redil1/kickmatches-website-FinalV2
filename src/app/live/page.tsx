'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import MetricBeacon from '@/components/MetricBeacon'


// Metadata will be handled by the parent page when iframe loads
const pageMetadata = {
  title: 'Show Plus TV Webplayer - Live IPTV Streaming | Premium Channels',
  description: 'Access Show Plus TV webplayer with premium IPTV streaming. Watch live football matches, sports channels, and entertainment content in high quality.',
  keywords: 'Show Plus TV, webplayer, live IPTV, premium streaming, live football, sports channels, entertainment, live TV'
}

// Enhanced Loading component with debugging info
interface IframeLoadingProps {
  debugInfo: string
  retryCount: number
  isConnecting: boolean
}

function IframeLoading({ debugInfo, retryCount, isConnecting }: IframeLoadingProps) {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black-900 via-black-800 to-black-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Loading Show Plus TV...</h3>
          <p className="text-gray-400">Connecting to premium IPTV webplayer</p>
          {retryCount > 0 && (
            <p className="text-yellow-400 text-sm">Retry attempt {retryCount}/3</p>
          )}
          {isConnecting && (
            <p className="text-blue-400 text-sm">🔄 Establishing connection...</p>
          )}
        </div>
        {debugInfo && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-300 text-xs font-mono">{debugInfo}</p>
          </div>
        )}
        <div className="mt-6">
          <button
            onClick={() => window.open('http://s.showplustv.pro/webplayer', '_blank')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all"
          >
            🔗 Open Direct Link
          </button>
        </div>
      </div>
    </div>
  )
}

// Iframe Error Fallback Component
function IframeError() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black-900 via-black-800 to-black-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-2xl font-bold text-white mb-2">Unable to Load Show Plus TV</h3>
        <p className="text-gray-400 mb-6">There was an issue loading the Show Plus TV webplayer. Please try refreshing the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all"
        >
          🔄 Refresh Page
        </button>
      </div>
    </div>
  )
}

// Seamless Redirect Component
interface SeamlessRedirectProps {
  url: string
  countdown?: number
}

function SeamlessRedirect({ url, countdown = 5 }: SeamlessRedirectProps) {
  const [timeLeft, setTimeLeft] = useState(countdown)
  const [isRedirecting, setIsRedirecting] = useState(false)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRedirecting(true)
          window.open(url, '_blank', 'noopener,noreferrer')
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    return () => clearInterval(timer)
  }, [url])
  
  const handleManualRedirect = () => {
    setIsRedirecting(true)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
  
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black-900 via-black-800 to-black-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-500">{timeLeft}</span>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Redirecting to Show Plus TV...</h3>
          <p className="text-gray-400">Opening webplayer in a new tab in {timeLeft} seconds</p>
          {isRedirecting && (
            <p className="text-green-400 text-sm">✓ Redirect initiated</p>
          )}
        </div>
        <button
          onClick={handleManualRedirect}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          🚀 Open Now
        </button>
      </div>
    </div>
  )
}

// Full Page Iframe Component with Enhanced Error Handling
function FullPageIframe() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isInIframe, setIsInIframe] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [errorType, setErrorType] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const [showRedirect, setShowRedirect] = useState(false)
  
  const maxRetries = 3
  const iframeUrl = 'http://s.showplustv.pro/webplayer'
  
  // Enhanced network and header check
  const checkNetworkAndHeaders = async () => {
    try {
      setDebugInfo('Checking network connectivity and headers...')
      
      // First, try a simple fetch to check connectivity
      const response = await fetch(iframeUrl, { 
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache'
      })
      
      // Check for iframe blocking headers
      const xFrameOptions = response.headers.get('X-Frame-Options')
      const csp = response.headers.get('Content-Security-Policy')
      
      let headerInfo = 'Headers checked: '
      if (xFrameOptions) {
        headerInfo += `X-Frame-Options: ${xFrameOptions}; `
        setErrorType('x-frame-options')
      }
      if (csp && csp.includes('frame-ancestors')) {
        headerInfo += `CSP frame-ancestors found; `
        setErrorType('csp-restriction')
      }
      
      setDebugInfo(headerInfo || 'No blocking headers detected')
      
      // If we have blocking headers, return false
      if (xFrameOptions || (csp && csp.includes('frame-ancestors'))) {
        return false
      }
      
      return true
    } catch (error) {
      // CORS error might indicate the site blocks cross-origin requests
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('CORS')) {
        setDebugInfo('CORS restriction detected - likely iframe blocking')
        setErrorType('cors-restriction')
      } else {
        setDebugInfo(`Network/Header check failed: ${errorMessage}`)
        setErrorType('network')
      }
      return false
    }
  }
  
  // Enhanced iframe loading with comprehensive checks
  const loadIframe = async () => {
    setIsConnecting(true)
    setDebugInfo('Attempting to load iframe...')
    
    // Check network connectivity and headers
    const canEmbed = await checkNetworkAndHeaders()
    
    if (!canEmbed && retryCount === 0) {
       setDebugInfo('Iframe embedding blocked - switching to redirect mode')
       // If iframe is blocked, show seamless redirect
       setTimeout(() => {
         setIsLoading(false)
         setShowRedirect(true)
       }, 1500)
     }
    
    setIsConnecting(false)
  }
  
  useEffect(() => {
    // Check if we're already in an iframe to prevent infinite loops
    try {
      setIsInIframe(window.self !== window.top)
    } catch (e) {
      setIsInIframe(true)
    }
    
    // Initial load attempt
    loadIframe()
    
    // Suppress console warnings and errors from iframe
    const originalConsoleWarn = console.warn
    const originalConsoleError = console.error
    
    console.warn = (...args) => {
      const message = args.join(' ')
      // Suppress specific iframe-related warnings
      if (
        message.includes('React DevTools') ||
        message.includes('autofocus') ||
        message.includes('cross-origin') ||
        message.includes('MutationObserver') ||
        message.includes('filter_content')
      ) {
        return
      }
      originalConsoleWarn.apply(console, args)
    }
    
    console.error = (...args) => {
      const message = args.join(' ')
      // Suppress specific iframe-related errors
      if (
        message.includes('MutationObserver') ||
        message.includes('filter_content') ||
        message.includes('cross-origin') ||
        message.includes('autofocus')
      ) {
        return
      }
      originalConsoleError.apply(console, args)
    }
    
    // Enhanced timeout with retry logic
    const fallbackTimer = setTimeout(() => {
      if (isLoading) {
        if (retryCount < maxRetries) {
          setDebugInfo(`Timeout reached, retry ${retryCount + 1}/${maxRetries}`)
          setRetryCount(prev => prev + 1)
          // Don't show fallback yet, try again
        } else {
          setErrorType('timeout')
          setShowFallback(true)
          setIsLoading(false)
          setDebugInfo('Maximum retries exceeded')
        }
      }
    }, 5000) // Increased timeout to 5 seconds
    
    return () => {
      clearTimeout(fallbackTimer)
      // Restore original console methods
      console.warn = originalConsoleWarn
      console.error = originalConsoleError
    }
  }, [isLoading, retryCount])
  
  const handleIframeLoad = () => {
    setIsLoading(false)
    setShowFallback(false)
    setHasError(false)
    setErrorType('')
    setDebugInfo('Iframe loaded successfully')
  }
  
  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
    setShowFallback(true)
    setErrorType('load_error')
    setDebugInfo('Iframe failed to load')
  }
  
  const handleRetry = () => {
    setIsLoading(true)
    setHasError(false)
    setShowFallback(false)
    setErrorType('')
    setRetryCount(0)
    setDebugInfo('Retrying connection...')
    loadIframe()
  }
  
  const openDirectLink = () => {
    window.open(iframeUrl, '_blank', 'noopener,noreferrer')
  }
  
  // Show seamless redirect if iframe is blocked
  if (showRedirect) {
    return <SeamlessRedirect url={iframeUrl} countdown={5} />
  }
  
  // If we're already in an iframe, show error to prevent infinite loops
  if (isInIframe) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black-900 via-black-800 to-black-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-md mx-auto px-6">
          <div className="text-6xl mb-4">🔄</div>
          <h3 className="text-2xl font-bold text-white mb-2">Iframe Loop Detected</h3>
          <p className="text-gray-400 mb-6">This page is already being displayed in an iframe. Please visit the main page directly.</p>
          <a
            href="/live"
            target="_top"
            className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all inline-block"
          >
            🔴 Open Live Page
          </a>
        </div>
      </div>
    )
  }
  
  // Enhanced fallback content with specific error handling
  if (hasError || showFallback) {
    const getErrorMessage = () => {
      switch (errorType) {
        case 'network':
          return {
            icon: '🌐',
            title: 'Network Connection Issue',
            description: 'Unable to connect to Show Plus TV servers. Please check your internet connection and try again.'
          }
        case 'timeout':
          return {
            icon: '⏱️',
            title: 'Connection Timeout',
            description: `Failed to load after ${maxRetries} attempts. The server may be temporarily unavailable.`
          }
        case 'load_error':
          return {
            icon: '❌',
            title: 'Loading Error',
            description: 'The webplayer failed to load properly. This may be due to browser restrictions or server issues.'
          }
        case 'x-frame-options':
          return {
            icon: '🔒',
            title: 'Iframe Embedding Blocked',
            description: 'The external site has X-Frame-Options headers that prevent iframe embedding. Use the direct link below.'
          }
        case 'csp-restriction':
          return {
            icon: '🛡️',
            title: 'Content Security Policy Restriction',
            description: 'The site\'s Content Security Policy prevents iframe embedding. Opening in a new tab is recommended.'
          }
        case 'cors-restriction':
          return {
            icon: '🌐',
            title: 'Cross-Origin Restriction',
            description: 'CORS policy prevents iframe embedding. The site must be accessed directly.'
          }
        default:
          return {
            icon: '🚫',
            title: 'External Site Loading Issue',
            description: 'The Show Plus TV webplayer cannot be loaded due to browser security restrictions or network issues.'
          }
      }
    }
    
    const errorInfo = getErrorMessage()
    
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-black-900 via-black-800 to-black-900 flex items-center justify-center">
        <div className="text-center space-y-6 max-w-lg mx-auto px-6">
          <div className="text-6xl mb-4">{errorInfo.icon}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{errorInfo.title}</h3>
          <p className="text-gray-400 mb-6">{errorInfo.description}</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={openDirectLink}
              className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-3 rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
            >
              🔴 Open Show Plus TV
            </button>
            <button
              onClick={handleRetry}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
            >
              🔄 Retry Connection
            </button>
          </div>
          
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-lg font-bold text-white mb-2">Debug Information</h4>
              <p className="text-gray-300 text-sm font-mono">{debugInfo}</p>
              {retryCount > 0 && (
                <p className="text-yellow-400 text-sm mt-2">Retry attempts: {retryCount}/{maxRetries}</p>
              )}
            </div>
          )}
          
          <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <h4 className="text-lg font-bold text-white mb-2">Troubleshooting Tips</h4>
            <ul className="text-gray-300 text-sm space-y-1 text-left">
              <li>• Check your internet connection</li>
              <li>• Disable ad blockers or VPN if enabled</li>
              <li>• Try refreshing the page</li>
              <li>• Use the direct link for full functionality</li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 w-full h-full">
      {isLoading && (
        <IframeLoading 
          debugInfo={debugInfo}
          retryCount={retryCount}
          isConnecting={isConnecting}
        />
      )}
      <iframe
        key={retryCount} // Force re-render on retry
        src={iframeUrl}
        className="w-full h-full border-0"
        title="Show Plus TV - Live Streaming Player"
        onLoad={(e) => {
          console.log('Iframe loaded successfully:', (e.target as HTMLIFrameElement).src)
          setDebugInfo('Iframe loaded successfully')
          handleIframeLoad()
        }}
        onError={(e) => {
          console.error('Iframe load error:', e)
          setDebugInfo('Iframe failed to load - likely blocked by headers')
          handleIframeError()
        }}
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture; camera; microphone; geolocation; payment; usb; web-share; clipboard-read; clipboard-write"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-top-navigation-by-user-activation allow-top-navigation"
        style={{
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
          overflow: 'hidden'
        }}
      />
    </div>
  )
}


export default function LivePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Show Plus TV Webplayer - Live Streaming",
    "description": "Access Show Plus TV webplayer for premium IPTV streaming with live sports, entertainment, and international channels.",
    "url": "https://kickai.matches/live",
    "mainEntity": {
      "@type": "VideoObject",
      "name": "Show Plus TV Live Stream",
      "description": "Premium IPTV streaming service with live channels and on-demand content",
      "embedUrl": "http://s.showplustv.pro/webplayer",
      "uploadDate": new Date().toISOString(),
      "publisher": {
        "@type": "Organization",
        "name": "Show Plus TV"
      }
    }
  }

  return (
    <>
      <Script
        id="live-iframe-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <MetricBeacon event="live-iframe-view" />
      
      {/* Full Page Iframe Implementation */}
      <FullPageIframe />
    </>
  )
}