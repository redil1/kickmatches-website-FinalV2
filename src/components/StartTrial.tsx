"use client"

import { useCallback, useState } from 'react'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'
import AlertGate from './AlertGate'

// Custom CSS animations
const customStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
    50% { box-shadow: 0 0 30px rgba(255, 215, 0, 0.6); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-fadeIn {
    animation: fadeIn 0.6s ease-out;
  }
  .animate-slideIn {
    animation: slideIn 0.5s ease-out;
  }
  .animate-glow {
    animation: glow 2s ease-in-out infinite;
  }
  .animate-shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`

type Props = {
  slug: string
}

export default function StartTrial({ slug }: Props) {
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [sending, setSending] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyUsedTrial, setAlreadyUsedTrial] = useState(false)
  const [telegramRegistered, setTelegramRegistered] = useState<boolean | null>(null)
  const [otpSent, setOtpSent] = useState(false)
  const [telegramId, setTelegramId] = useState('')
  const [credentials, setCredentials] = useState<{username: string, password: string, expiresAt: string} | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const { permission, hasSubscription } = useNotificationPermission()

  const steps = [
    { id: 1, title: 'Telegram Setup', icon: '📱', description: 'Connect to our bot' },
    { id: 2, title: 'Register ID', icon: '🆔', description: 'Link your Telegram' },
    { id: 3, title: 'Enter Details', icon: '📧', description: 'Email & phone' },
    { id: 4, title: 'Verify Code', icon: '🔐', description: 'OTP confirmation' },
    { id: 5, title: 'Activate Trial', icon: '🚀', description: 'Get VIP access' }
  ]

  const markStepCompleted = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId])
    }
  }

  const goToStep = (stepId: number) => {
    setCurrentStep(stepId)
    setError(null)
  }

  const requestOtp = useCallback(async () => {
    setError(null)
    if (!phone) return
    
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      
      if (data.ok) {
        setOtpSent(true)
        setTelegramRegistered(data.telegramRegistered)
        markStepCompleted(3)
        setCurrentStep(4)
        if (!data.telegramRegistered) {
          setError('To receive OTP codes via Telegram, please register your Telegram ID first using the steps above.')
        }
      } else {
        setError(data.error || 'Failed to send OTP')
      }
    } catch (e) {
      setError('Failed to send OTP')
    }
  }, [phone])
  
  const registerTelegram = useCallback(async () => {
    console.log('🔍 registerTelegram called with:', { phone, telegramId })
    console.log('🔍 Button disabled state:', !phone || !telegramId)
    
    if (!phone || !telegramId) {
      const errorMsg = 'Please enter both phone number and Telegram ID'
      console.log('❌ Validation failed:', errorMsg)
      setError(errorMsg)
      return
    }
    
    console.log('✅ Validation passed, making API call...')
    
    try {
      const res = await fetch('/api/telegram/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, telegramId }),
      })
      const data = await res.json()
      
      console.log('📡 API response:', data)
      
      if (data.ok) {
        setTelegramRegistered(true)
        setError(null)
        markStepCompleted(2)
        setCurrentStep(3)
        console.log('✅ Registration successful!')
      } else {
        console.log('❌ Registration failed:', data.error)
        setError(data.error || 'Failed to register Telegram ID')
      }
    } catch (e) {
      console.log('❌ Network error:', e)
      setError('Failed to register Telegram ID')
    }
  }, [phone, telegramId])

  const start = useCallback(async () => {
    setSending(true)
    setError(null)
    try {
      // Enhanced fingerprint for N8N webhook compatibility (matching working curl)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Canvas fingerprint test', 2, 2);
      }
      const canvasFingerprint = canvas.toDataURL();
      
      // Create comprehensive fingerprint hash
      const fingerprint_hash = btoa(
        [
          navigator.userAgent, 
          screen.width, 
          screen.height, 
          screen.colorDepth, 
          navigator.platform,
          navigator.language,
          Intl.DateTimeFormat().resolvedOptions().timeZone,
          canvasFingerprint.substring(0, 50)
        ].join('|')
      ).substring(0, 32); // 32 char hash like the working example
      
      const device_type = /mobile/i.test(navigator.userAgent) ? 'mobile' : 
                         /android/i.test(navigator.userAgent) ? 'android' : 'desktop'
      
      // Validate browser capabilities
      if (!navigator.userAgent || !window.screen || !Intl?.DateTimeFormat) {
        throw new Error('Browser does not support required features for trial activation')
      }

      // Enhanced fingerprint details - ALL dynamic, NO fallbacks
      const fingerprint_details = {
        canvas: canvasFingerprint,
        hardware: {
          screen: {
            width: screen.width,
            height: screen.height,
            pixelRatio: window.devicePixelRatio
          },
          cores: navigator.hardwareConcurrency,
          touchPoints: navigator.maxTouchPoints
        },
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        platform: navigator.platform,
        language: navigator.language
      }

      // Validate all collected data before sending
      if (!fingerprint_details.canvas || !fingerprint_details.userAgent || !fingerprint_details.timezone ||
          !fingerprint_details.hardware.screen.width || !fingerprint_details.hardware.screen.height ||
          fingerprint_details.hardware.cores === undefined || fingerprint_details.hardware.touchPoints === undefined ||
          !fingerprint_details.platform || !fingerprint_details.language) {
        throw new Error('Unable to collect complete device fingerprint. Please try again.')
      }
      
      // Use provided email or generate from phone as fallback
      const userEmail = email || `${phone.replace('+', '').replace(/\D/g, '')}@kickai.trial`
      
      const res = await fetch('/api/trial/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          token, 
          fingerprint_hash, 
          device_type, 
          browser_info: navigator.userAgent, 
          slug,
          email: userEmail,
          fingerprint_details
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        // Handle specific errors
        if (json?.error === 'cooldown') {
          setAlreadyUsedTrial(true)
          return // Don't throw error, just set the state
        } else if (json?.error === 'bad_request') {
          // Handle validation errors from improved backend
          throw new Error(json?.message || 'Please ensure all required data is available and try again.')
        } else if (json?.error === 'provisioning_unavailable' || json?.error === 'provisioning_error') {
          // Use the detailed message from the server
          throw new Error(json?.message || 'Trial service is temporarily unavailable. Please try again in a few minutes.')
        } else if (json?.error === 'provisioning_failed' || json?.error === 'provisioning_incomplete') {
          throw new Error(json?.message || 'Trial creation failed. Please try again later.')
        } else {
          throw new Error(json?.message || json?.error || 'Failed')
        }
      }
      // Store credentials for real-time display
      if (json.username && json.password && json.expiresAt) {
        setCredentials({
          username: json.username,
          password: json.password,
          expiresAt: json.expiresAt
        })
      }
      setOk(true)
    } catch (e: any) {
      setError(e.message || 'Failed')
    } finally {
      setSending(false)
    }
  }, [phone, email, token, slug])

  if (ok)
    return (
      <div className="relative bg-gradient-to-br from-professional-black via-gray-900/50 to-professional-black rounded-3xl p-8 shadow-2xl border-2 border-professional-gold/50 overflow-hidden">
        {/* Success background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-professional-gold/10 via-professional-red/5 to-professional-gold/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-professional-gold via-professional-red to-professional-gold"></div>
        
        <div className="relative z-10 text-center">
          <div className="text-8xl mb-6 animate-bounce">🎉</div>
          <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-professional-gold via-yellow-400 to-professional-gold mb-4">
            VIP TRIAL ACTIVATED!
          </h3>
          <div className="bg-gradient-to-r from-professional-gold/20 to-professional-red/20 rounded-2xl p-6 mb-6 border border-professional-gold/30">
            <div className="text-2xl font-black text-white mb-2">🚀 SUCCESS!</div>
            <div className="text-professional-gold text-lg">Your premium credentials are ready</div>
            <div className="text-professional-red text-sm mt-2">📱 Also sent to your Telegram</div>
          </div>
          
          {/* Real-time credential display */}
          {credentials && (
            <div className="bg-gradient-to-r from-black/50 to-gray-900/50 rounded-2xl p-6 mb-6 border border-professional-gold/30">
              <div className="text-professional-gold text-lg font-bold mb-4">📋 Subscription Credentials:</div>
              
              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-4 border border-professional-red/20">
                  <div className="text-professional-red font-bold text-sm mb-2">🔗 Xtream Code:</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-gray-300 font-semibold">Site:</span>
                      <code className="bg-black/50 px-2 py-1 rounded text-professional-gold break-all">
                        http://s.showplustv.pro:80
                      </code>
                      <span className="text-gray-400">or</span>
                      <code className="bg-black/50 px-2 py-1 rounded text-professional-gold break-all">
                        http://splustv.me:80
                      </code>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-gray-300 font-semibold">Login:</span>
                      <code className="bg-black/50 px-2 py-1 rounded text-white break-all">
                        {credentials.username}
                      </code>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1">
                      <span className="text-gray-300 font-semibold">Password:</span>
                      <code className="bg-black/50 px-2 py-1 rounded text-white break-all">
                        {credentials.password}
                      </code>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/30 rounded-xl p-4 border border-professional-gold/20">
                  <div className="text-professional-gold font-bold text-sm mb-2">📺 M3U Link:</div>
                  <code className="bg-black/50 px-2 py-1 rounded text-white text-xs break-all block">
                    http://splustv.me:80/get.php?username={credentials.username}&password={credentials.password}&type=m3u&output=ts
                  </code>
                </div>
                
                <div className="bg-professional-red/10 rounded-xl p-3 border border-professional-red/20">
                  <div className="text-professional-red text-xs font-semibold">⏰ Expires: {new Date(credentials.expiresAt).toLocaleString()}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Benefits reminder */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-professional-gold/10 to-yellow-600/10 rounded-xl p-3 border border-professional-gold/30">
              <div className="text-professional-gold text-xl mb-1">⏰</div>
              <div className="text-white font-bold text-sm">12 HOURS</div>
              <div className="text-gray-300 text-xs">Full access</div>
            </div>
            <div className="bg-gradient-to-r from-professional-red/10 to-red-600/10 rounded-xl p-3 border border-professional-red/30">
              <div className="text-professional-red text-xl mb-1">📺</div>
              <div className="text-white font-bold text-sm">15K+ CHANNELS</div>
              <div className="text-gray-300 text-xs">All sports & more</div>
            </div>
          </div>
          
          <div className="text-professional-gold text-sm animate-pulse">
            ✨ Welcome to the VIP experience! ✨
          </div>
        </div>
      </div>
    )

  if (alreadyUsedTrial)
    return (
      <div className="relative bg-gradient-to-br from-professional-black via-gray-900 to-professional-black rounded-3xl p-8 shadow-2xl border-2 border-professional-gold/50 overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-professional-gold/10 via-professional-red/5 to-professional-gold/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-professional-gold via-professional-red to-professional-gold animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce">👑</div>
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-professional-gold via-yellow-500 to-professional-gold mb-3">
              VIP MEMBER DETECTED
            </h3>
            <p className="text-xl text-gray-200 mb-6">
              You've already experienced our <span className="font-bold text-professional-gold">PREMIUM TRIAL</span>
            </p>
            
            {/* Urgency Counter */}
            <div className="bg-gradient-to-r from-professional-red/20 to-red-500/20 rounded-2xl p-6 mb-6 border border-professional-red/30">
              <div className="text-professional-red text-sm font-semibold mb-2">🔥 LIMITED TIME OFFER</div>
              <div className="text-2xl font-black text-white mb-2">90% OFF PREMIUM</div>
              <div className="text-professional-red text-sm">Only for returning trial users • Expires in 24h</div>
            </div>
          </div>

          {/* Premium CTA with urgency */}
          <div className="space-y-6">
            <a
              href="https://www.iptv.shopping/pricing?source=kickai_matches&campaign=trial_used&user=returning&discount=90"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-full bg-gradient-to-r from-professional-gold via-yellow-400 to-professional-gold hover:from-yellow-400 hover:via-yellow-300 hover:to-yellow-400 text-black py-6 px-8 rounded-2xl font-black text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl text-center border-2 border-professional-gold overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="relative z-10">
                <div className="text-2xl font-black mb-1">🚀 CLAIM 90% DISCOUNT</div>
                <div className="text-lg font-bold">UPGRADE TO UNLIMITED NOW</div>
              </div>
            </a>

            {/* Premium benefits showcase */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-professional-gold/10 to-yellow-600/10 rounded-xl p-4 border border-professional-gold/30">
                <div className="text-professional-gold text-2xl mb-2">∞</div>
                <div className="text-white font-bold text-sm">UNLIMITED ACCESS</div>
                <div className="text-gray-300 text-xs">No time limits</div>
              </div>
              <div className="bg-gradient-to-r from-professional-red/10 to-red-600/10 rounded-xl p-4 border border-professional-red/30">
                <div className="text-professional-red text-2xl mb-2">📺</div>
                <div className="text-white font-bold text-sm">15,000+ CHANNELS</div>
                <div className="text-gray-300 text-xs">All sports & more</div>
              </div>
              <div className="bg-gradient-to-r from-professional-gold/10 to-yellow-600/10 rounded-xl p-4 border border-professional-gold/30">
                <div className="text-professional-gold text-2xl mb-2">⚡</div>
                <div className="text-white font-bold text-sm">4K ULTRA HD</div>
                <div className="text-gray-300 text-xs">Crystal clear</div>
              </div>
              <div className="bg-gradient-to-r from-professional-red/10 to-red-600/10 rounded-xl p-4 border border-professional-red/30">
                <div className="text-professional-red text-2xl mb-2">🛡️</div>
                <div className="text-white font-bold text-sm">INSTANT ACCESS</div>
                <div className="text-gray-300 text-xs">No waiting</div>
              </div>
            </div>

            {/* Social proof & urgency */}
            <div className="text-center bg-black/50 rounded-xl p-4 border border-gray-700">
              <div className="text-professional-gold text-sm font-semibold mb-1">⚡ 847 people upgraded in the last 24 hours</div>
              <div className="text-gray-300 text-xs">Join thousands of satisfied premium users</div>
              <div className="text-professional-red text-xs mt-2 animate-pulse">🔥 Trial cooldown: Resets in 18 hours</div>
            </div>
          </div>
        </div>
      </div>
    )

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      <AlertGate>
        <div className="relative bg-gradient-to-br from-black via-gray-900 to-black rounded-3xl shadow-2xl border-2 border-yellow-500/30 overflow-hidden animate-fadeIn">
      {/* Premium animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-red-500/3 to-yellow-500/5 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 via-red-500 to-yellow-500"></div>
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-professional-gold rounded-full animate-ping"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-professional-red rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-3/4 w-1.5 h-1.5 bg-professional-gold rounded-full animate-ping" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 p-8">
        {/* Header */}
        <div className="text-center mb-8 animate-slideIn">
          <div className="text-6xl mb-4 animate-bounce animate-float">🏆</div>
          <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-professional-gold via-professional-red to-professional-gold mb-4 animate-shimmer">
            EXCLUSIVE VIP TRIAL
          </h3>
          <p className="text-xl text-gray-200 mb-2">Get <span className="font-black text-professional-gold">12 HOURS</span> of premium access</p>
          <p className="text-professional-red font-bold animate-pulse">🔥 LIMITED TIME • NORMALLY $49.99</p>
          
          {/* Urgency timer */}
          <div className="mt-6 bg-gradient-to-r from-professional-red/20 to-professional-red/20 rounded-2xl p-4 border border-professional-red/30 animate-glow">
            <div className="text-professional-red text-sm font-semibold mb-1">⏰ OFFER EXPIRES SOON</div>
            <div className="text-white text-lg font-bold">FREE TRIAL AVAILABLE NOW</div>
          </div>
        </div>

        {/* Horizontal Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id
              const isCompleted = completedSteps.includes(step.id)
              const isAccessible = step.id <= currentStep || isCompleted
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  {/* Step Circle */}
                  <div 
                    className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 cursor-pointer ${
                      isCompleted 
                        ? 'bg-professional-gold border-professional-gold text-black' 
                        : isActive 
                        ? 'bg-professional-red border-professional-red text-white animate-pulse' 
                        : isAccessible
                        ? 'bg-gray-700 border-gray-500 text-gray-300 hover:border-professional-gold'
                        : 'bg-gray-800 border-gray-600 text-gray-500'
                    }`}
                    onClick={() => isAccessible && goToStep(step.id)}
                  >
                    {isCompleted ? (
                      <span className="text-lg">✓</span>
                    ) : (
                      <span className="text-lg">{step.icon}</span>
                    )}
                    
                    {/* Step number badge */}
                    <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                      isCompleted ? 'bg-professional-gold text-black' : 'bg-professional-red text-white'
                    }`}>
                      {step.id}
                    </div>
                  </div>
                  
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded transition-all duration-300 ${
                      completedSteps.includes(step.id) ? 'bg-professional-gold' : 'bg-gray-600'
                    }`}></div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Step Labels */}
          <div className="flex items-center justify-between">
            {steps.map((step) => {
              const isActive = currentStep === step.id
              const isCompleted = completedSteps.includes(step.id)
              
              return (
                <div key={step.id} className="flex-1 text-center px-2">
                  <div className={`font-bold text-sm transition-all duration-300 ${
                    isCompleted ? 'text-professional-gold' : isActive ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                  <div className={`text-xs transition-all duration-300 ${
                    isCompleted ? 'text-professional-gold/80' : isActive ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    {step.description}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      
        {/* Step Content */}
        <div className="min-h-[400px]">
          {/* Step 1: Telegram Setup */}
          {currentStep === 1 && (
            <div className="bg-gradient-to-r from-professional-red/20 to-professional-red/20 rounded-2xl p-6 border border-professional-red/30 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-float">📱</div>
                <div className="text-professional-red font-bold text-xl mb-2">TELEGRAM SETUP REQUIRED</div>
                <div className="text-gray-300 text-sm">Follow these steps to receive your OTP code instantly</div>
              </div>
            
              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex items-start gap-4 bg-black/30 rounded-xl p-4 border border-professional-red/20">
                  <div className="flex-shrink-0 w-8 h-8 bg-professional-red text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm mb-1">📲 Install Telegram</div>
                    <div className="text-gray-300 text-xs">Make sure Telegram is installed on your phone</div>
                  </div>
                </div>
                
                {/* Step 2 */}
                <div className="flex items-start gap-4 bg-black/30 rounded-xl p-4 border border-professional-red/20">
                  <div className="flex-shrink-0 w-8 h-8 bg-professional-red text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm mb-2">🔗 Connect to Our Bot</div>
                    <div className="text-gray-300 text-xs mb-3">Choose one of these methods:</div>
                    
                    {/* Method A */}
                    <div className="bg-professional-red/10 rounded-lg p-3 mb-2 border border-professional-red/20">
                      <div className="text-professional-red font-semibold text-xs mb-1">Method A: Direct Link</div>
                      <a 
                        href="https://t.me/IPTVAccess_bot" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-professional-red to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-4 rounded-xl text-lg font-black transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-professional-red/50 hover:border-red-400 animate-pulse hover:animate-none hover:shadow-red-500/50"
                      >
                        <span className="text-2xl">📱</span>
                        <span>Click to Install & Open Telegram Bot</span>
                      </a>
                    </div>
                    
                    {/* Method B */}
                    <div className="bg-professional-red/10 rounded-lg p-3 border border-professional-red/20">
                      <div className="text-professional-red font-semibold text-xs mb-1">Method B: Search in Telegram</div>
                      <div className="text-gray-300 text-xs mb-2">1. Open Telegram app</div>
                      <div className="text-gray-300 text-xs mb-2">2. Type: <span className="bg-black/50 px-2 py-1 rounded font-mono text-professional-red">@IPTVAccess_bot</span></div>
                      <div className="text-gray-300 text-xs">3. Select the bot from search results</div>
                    </div>
                  </div>
                </div>
                
                {/* Step 3 */}
                <div className="flex items-start gap-4 bg-black/30 rounded-xl p-4 border border-professional-red/20">
                  <div className="flex-shrink-0 w-8 h-8 bg-professional-red text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-sm mb-1">💬 Start Conversation</div>
                    <div className="text-professional-red text-xs mb-2">⚠️ IMPORTANT: You MUST start a conversation with the bot</div>
                    <div className="text-gray-300 text-xs">Click "START" or send any message to activate OTP delivery</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 text-center">
                <button
                  onClick={() => {
                    markStepCompleted(1)
                    setCurrentStep(2)
                  }}
                  className="bg-gradient-to-r from-professional-red to-professional-gold hover:from-red-600 hover:to-yellow-400 text-white px-10 py-4 rounded-xl font-black text-xl transition-all duration-300 transform hover:scale-110 shadow-2xl border-2 border-professional-gold/50 hover:border-professional-gold animate-pulse hover:animate-none hover:shadow-professional-gold/50"
                >
                  🔗 Click to Confirm Bot Connection
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Register Telegram ID */}
          {currentStep === 2 && (
            <div className="bg-gradient-to-r from-professional-gold/20 to-professional-gold/20 rounded-2xl p-6 border border-professional-gold/30 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">🆔</div>
                <div className="text-professional-gold font-bold text-xl mb-2">REGISTER YOUR TELEGRAM ID</div>
                <div className="text-gray-300 text-sm">Link your Telegram account to receive instant OTP codes</div>
              </div>
              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-4 border border-professional-gold/20">
                  <div className="text-white font-bold text-sm mb-3">📋 How to find your Telegram ID:</div>
                  <div className="space-y-2 text-gray-300 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-professional-gold text-black rounded-full flex items-center justify-center font-bold text-xs">1</span>
                      <span>Send <code className="bg-black/50 px-2 py-1 rounded text-professional-gold">/start</code> to <code className="bg-black/50 px-2 py-1 rounded text-professional-gold">@userinfobot</code> in Telegram</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-professional-gold text-black rounded-full flex items-center justify-center font-bold text-xs">2</span>
                      <span>Copy your ID number (e.g., 123456789)</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <input
                    className="w-full bg-black/50 border-2 border-professional-gold/30 hover:border-professional-gold/50 focus:border-professional-gold rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 text-lg font-medium"
                    placeholder="📱 Enter your phone number first"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  
                  <input
                    className="w-full bg-black/50 border-2 border-professional-gold/30 hover:border-professional-gold/50 focus:border-professional-gold rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 text-lg font-medium"
                    placeholder="🆔 Enter your Telegram ID (numbers only)"
                    value={telegramId}
                    onChange={(e) => setTelegramId(e.target.value.replace(/\D/g, ''))}
                  />
                  
                  <button
                    onClick={registerTelegram}
                    disabled={!phone || !telegramId}
                    className="w-full bg-gradient-to-r from-professional-gold to-professional-red hover:from-yellow-400 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-10 py-5 rounded-xl font-black text-xl transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 shadow-2xl border-2 border-professional-gold/50 hover:border-professional-gold animate-pulse hover:animate-none hover:shadow-professional-gold/50"
                  >
                    {!phone || !telegramId ? '⚠️ Enter Phone & Telegram ID First' : '📱 Click to Register Your ID'}
                  </button>
                  
                  {telegramRegistered === true && (
                    <div className="bg-professional-gold/20 rounded-xl p-4 border border-professional-gold/30 text-center">
                      <div className="text-professional-gold font-bold text-lg mb-2">✅ SUCCESS!</div>
                      <div className="text-white text-sm">Your Telegram is now connected for instant OTP delivery</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Enter Details */}
          {currentStep === 3 && (
            <div className="bg-gradient-to-r from-professional-gold/20 to-professional-gold/20 rounded-2xl p-6 border border-professional-gold/30 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce">🎯</div>
                <div className="text-professional-gold font-bold text-xl mb-2">CLAIM YOUR VIP ACCESS</div>
                <div className="text-gray-300 text-sm">We'll send your OTP code instantly</div>
              </div>
              <div className="space-y-4">
                <div className="relative group">
                  <input
                    className="w-full bg-black/70 backdrop-blur-sm border-2 border-professional-gold/30 hover:border-professional-gold/50 focus:border-professional-gold rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 text-lg font-medium"
                    placeholder="📧 Enter your email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-professional-gold/5 to-professional-red/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                
                <div className="relative group">
                  <input
                    className="w-full bg-black/70 backdrop-blur-sm border-2 border-professional-gold/30 hover:border-professional-gold/50 focus:border-professional-gold rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 text-lg font-medium"
                    placeholder="📱 Enter your phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-professional-gold/5 to-professional-red/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                
                <div className="text-center">
                  <button 
                    onClick={requestOtp} 
                    disabled={!phone || !email}
                    className="group relative bg-gradient-to-r from-professional-gold to-professional-red hover:from-yellow-400 hover:to-red-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-6 rounded-xl font-black text-2xl transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 shadow-2xl overflow-hidden border-2 border-professional-gold/50 hover:border-professional-gold animate-pulse hover:animate-none hover:shadow-professional-gold/50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                    <div className="relative z-10">
                      {!phone || !email ? '⚠️ Fill Details Above First' : '📲 Click to Send OTP Code'}
                    </div>
                  </button>
                </div>
                
                {otpSent && (
                  <div className="bg-professional-gold/20 rounded-xl p-4 border border-professional-gold/30 text-center animate-pulse">
                    <div className="text-professional-gold font-bold text-lg mb-2">✅ OTP SENT!</div>
                    <div className="text-white text-sm">
                      {telegramRegistered === true 
                        ? 'Check your Telegram chat for the code' 
                        : 'Check your phone for the SMS code'
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Verify Code */}
          {currentStep === 4 && (
            <div className="bg-gradient-to-r from-professional-red/20 to-professional-red/20 rounded-2xl p-6 border border-professional-red/30 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-glow">🔐</div>
                <div className="text-professional-red font-bold text-xl mb-2">VERIFY YOUR CODE</div>
                <div className="text-gray-300 text-sm">
                  {telegramRegistered === true 
                    ? 'Enter the 6-digit code from your Telegram chat' 
                    : 'Enter the 6-digit code from your SMS'
                  }
                </div>
              </div>
              
              <div className="space-y-4">
                <input
                  className="w-full bg-black/70 backdrop-blur-sm border-2 border-professional-red/30 hover:border-professional-red/50 focus:border-professional-red rounded-xl px-6 py-4 text-white placeholder-gray-400 focus:outline-none transition-all duration-300 text-2xl font-bold text-center tracking-widest"
                  placeholder="🔐 000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                />
                
                <div className="text-center">
                  <button
                    onClick={() => {
                      if (token.length === 6) {
                        markStepCompleted(4)
                        setCurrentStep(5)
                      }
                    }}
                    disabled={token.length !== 6}
                    className="bg-gradient-to-r from-professional-red to-professional-gold hover:from-red-600 hover:to-yellow-400 disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-6 rounded-xl font-black text-2xl transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 shadow-2xl border-2 border-professional-gold/50 hover:border-professional-gold animate-pulse hover:animate-none hover:shadow-professional-gold/50"
                  >
                    {token.length !== 6 ? '⚠️ Enter 6-Digit Code Above' : '✅ Click to Verify Code'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Activate Trial */}
          {currentStep === 5 && (
            <div className="bg-gradient-to-r from-professional-gold/20 to-professional-red/20 rounded-2xl p-6 border border-professional-gold/30 animate-fadeIn">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4 animate-bounce animate-glow">🚀</div>
                <div className="text-professional-gold font-bold text-2xl mb-2 animate-shimmer">ACTIVATE YOUR VIP TRIAL</div>
                <div className="text-gray-300 text-sm">You're one click away from premium access!</div>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-professional-gold/10 to-professional-gold/20 rounded-xl p-3 border border-professional-gold/30 text-center">
                    <div className="text-professional-gold text-lg mb-1">🛡️</div>
                    <div className="text-white font-bold text-xs">SECURE</div>
                    <div className="text-gray-300 text-xs">256-bit encryption</div>
                  </div>
                  <div className="bg-gradient-to-r from-professional-red/10 to-professional-red/20 rounded-xl p-3 border border-professional-red/30 text-center">
                    <div className="text-professional-red text-lg mb-1">⚡</div>
                    <div className="text-white font-bold text-xs">INSTANT</div>
                    <div className="text-gray-300 text-xs">Access in 30 seconds</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <button 
                    onClick={start} 
                    disabled={sending || !phone || !token}
                    className="w-full bg-gradient-to-r from-professional-red via-professional-red to-professional-gold hover:from-red-600 hover:via-professional-red hover:to-professional-gold disabled:from-gray-600 disabled:to-gray-700 text-white px-12 py-8 rounded-xl font-black text-2xl transition-all duration-300 transform hover:scale-110 disabled:hover:scale-100 disabled:opacity-50 shadow-2xl border-4 border-professional-gold hover:border-yellow-400 animate-pulse hover:animate-none hover:shadow-professional-gold/50"
                  >
                    {sending ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                        ACTIVATING VIP TRIAL...
                      </div>
                    ) : (
                      '🚀 CLICK TO ACTIVATE VIP TRIAL NOW'
                    )}
                  </button>
                </div>
                
                <div className="text-center bg-black/50 rounded-xl p-4 border border-professional-gold/30">
                  <div className="text-professional-gold text-sm font-bold mb-1">⚡ 1,247 trials claimed today</div>
                  <div className="text-gray-300 text-xs">Join thousands enjoying premium access</div>
                  <div className="text-professional-red text-xs mt-2 animate-pulse">🔥 Limited spots available</div>
                </div>
              </div>
            </div>
          )}
        </div>
        
          {error && (
            <div className="bg-gradient-to-r from-red-600/20 to-red-500/20 border-2 border-red-500/40 rounded-2xl p-6 text-center">
              <div className="text-red-400 text-xl mb-2">⚠️</div>
              <div className="text-red-200 font-bold text-lg mb-1">ACTIVATION ERROR</div>
              <div className="text-red-300 text-sm">{error}</div>
              <div className="text-gray-400 text-xs mt-2">Please try again or contact support</div>
            </div>
          )}
        </div>
      </div>
      </AlertGate>
    </>
  )
}


