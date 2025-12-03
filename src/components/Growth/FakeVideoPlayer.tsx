'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Loader2, Send, Copy, Play, Pause, Volume2, Maximize, Settings, AlertTriangle, Wifi } from 'lucide-react'

interface FakeVideoPlayerProps {
    homeTeam: string
    awayTeam: string
}

export default function FakeVideoPlayer({ homeTeam, awayTeam }: FakeVideoPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(true)
    const [showOverlay, setShowOverlay] = useState(false)
    const [overlayState, setOverlayState] = useState<'locked' | 'verifying' | 'failed'>('locked')
    const [timeLeft, setTimeLeft] = useState(5) // 5 seconds for testing
    const [progress, setProgress] = useState(0)

    // Timer for the "Free Preview"
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer)
                    setShowOverlay(true)
                    setIsPlaying(false)
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        // Fake progress bar movement
        const progressTimer = setInterval(() => {
            setProgress(p => (p >= 100 ? 0 : p + 0.1))
        }, 100)

        return () => {
            clearInterval(timer)
            clearInterval(progressTimer)
        }
    }, [])

    const getShareUrl = (platform: string) => {
        const url = window.location.href
        const text = `Watch ${homeTeam} vs ${awayTeam} Live Stream Free! 🔴`

        switch (platform) {
            case 'whatsapp':
                return `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
            case 'telegram':
                return `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
            case 'facebook':
                return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
            case 'twitter':
                return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
            case 'reddit':
                return `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`
            default:
                return url
        }
    }

    const handleShare = async (platform: string) => {
        // 1. Open Real Share Dialog
        const shareUrl = getShareUrl(platform)
        window.open(shareUrl, '_blank')

        // 2. Start the "Trap" Sequence
        setOverlayState('verifying')

        // Simulate verification delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // FAIL the verification intentionally
        setOverlayState('failed')

        // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'https://www.iptv.shopping/pricing?utm_source=pmm&utm_medium=player_lock&utm_campaign=server_overload'
        }, 3000)
    }

    return (
        <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group">
            {/* Background / "Stream" Content */}
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Simulated Stream Content */}
                <div className="text-center space-y-4">
                    <div className="flex items-center justify-center gap-8 opacity-50">
                        <div className="text-right">
                            <div className="text-2xl font-bold text-white">{homeTeam}</div>
                        </div>
                        <div className="text-4xl font-black text-white/20">VS</div>
                        <div className="text-left">
                            <div className="text-2xl font-bold text-white">{awayTeam}</div>
                        </div>
                    </div>

                    {/* Buffering / Loading State */}
                    {isPlaying && (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-12 h-12 text-gold-500 animate-spin" />
                            <p className="text-gold-400 font-mono text-sm animate-pulse">
                                ESTABLISHING SECURE CONNECTION...
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fake Player UI Overlay (Controls) */}
            <div className={`absolute inset-0 flex flex-col justify-between p-4 transition-opacity duration-300 ${showOverlay ? 'opacity-0' : 'opacity-100 group-hover:opacity-100'}`}>
                {/* Top Bar */}
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 bg-red-600/80 backdrop-blur px-3 py-1 rounded text-white text-xs font-bold animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        LIVE
                    </div>
                    <div className="text-white/50 text-xs font-mono">
                        HD 1080p • 60FPS
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="bg-gradient-to-t from-black/90 to-transparent pt-12 pb-2 px-4 -mx-4 -mb-4">
                    {/* Progress Bar */}
                    <div className="w-full h-1 bg-white/20 rounded-full mb-4 cursor-pointer">
                        <div
                            className="h-full bg-red-600 rounded-full relative"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full shadow-lg scale-0 group-hover:scale-100 transition-transform"></div>
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setIsPlaying(!isPlaying)}>
                                {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                            </button>
                            <div className="flex items-center gap-2 group/vol">
                                <Volume2 className="w-5 h-5" />
                                <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                                    <div className="w-20 h-1 bg-white/20 rounded-full ml-2">
                                        <div className="w-3/4 h-full bg-white rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-300">
                                {Math.floor(progress * 0.9)}:12 / 90:00
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Settings className="w-5 h-5 hover:rotate-90 transition-transform cursor-pointer" />
                            <Maximize className="w-5 h-5 hover:scale-110 transition-transform cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>

            {/* BLOCKER OVERLAY */}
            <AnimatePresence>
                {showOverlay && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                    >
                        <div className="max-w-md w-full text-center space-y-6">

                            {/* LOCKED STATE */}
                            {overlayState === 'locked' && (
                                <>
                                    <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                        <AlertTriangle className="w-10 h-10 text-red-500" />
                                    </div>

                                    <div>
                                        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                                            SERVER OVERLOAD
                                        </h2>
                                        <p className="text-gray-400 text-lg">
                                            Free bandwidth limit reached.
                                            <br />
                                            <span className="text-gold-400 font-bold">Share to unlock a Priority Slot.</span>
                                        </p>
                                    </div>

                                    <div className="grid gap-3">
                                        <button
                                            onClick={() => handleShare('whatsapp')}
                                            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105"
                                        >
                                            <Send className="w-5 h-5" />
                                            Share on WhatsApp
                                        </button>
                                        <button
                                            onClick={() => handleShare('telegram')}
                                            className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105"
                                        >
                                            <Send className="w-5 h-5" />
                                            Share on Telegram
                                        </button>
                                        <button
                                            onClick={() => handleShare('facebook')}
                                            className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105"
                                        >
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.971.956-2.971 3.594v.957h5.598l-1 3.676h-4.598v7.98c0 .033 0 .037-.006.037h-4.838z" /></svg>
                                            Share on Facebook
                                        </button>
                                        <button
                                            onClick={() => handleShare('twitter')}
                                            className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105 border border-gray-800"
                                        >
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                                            Share on X
                                        </button>
                                        <button
                                            onClick={() => handleShare('reddit')}
                                            className="w-full bg-[#FF4500] hover:bg-[#e03d00] text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:scale-105"
                                        >
                                            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.561-1.249-1.249-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
                                            Share on Reddit
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* VERIFYING STATE */}
                            {overlayState === 'verifying' && (
                                <div className="space-y-4">
                                    <Loader2 className="w-16 h-16 text-gold-500 animate-spin mx-auto" />
                                    <h2 className="text-xl font-bold text-white">Verifying Share...</h2>
                                    <p className="text-gray-400">Please wait while we validate your referral.</p>
                                </div>
                            )}

                            {/* FAILED / UPSELL STATE */}
                            {overlayState === 'failed' && (
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="space-y-6"
                                >
                                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                                        <Wifi className="w-10 h-10 text-white" />
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-black text-white mb-2">
                                            FREE SERVERS FULL
                                        </h2>
                                        <p className="text-red-200 bg-red-900/30 p-3 rounded-lg border border-red-500/30 text-sm">
                                            We apologize. All free slots are currently occupied by other viewers.
                                        </p>
                                    </div>

                                    <div className="bg-gradient-to-br from-gold-600/20 to-gold-500/10 border border-gold-500/30 rounded-xl p-4">
                                        <p className="text-gold-400 font-bold text-sm mb-1">GOOD NEWS:</p>
                                        <p className="text-white text-sm">
                                            We have reserved a <span className="font-bold text-gold-400">Premium Slot</span> for you.
                                            <br />
                                            Reservation expires in <span className="font-mono text-red-400">01:59</span>
                                        </p>
                                    </div>

                                    <a
                                        href="https://www.iptv.shopping/pricing?utm_source=pmm&utm_medium=player_lock&utm_campaign=server_overload"
                                        className="block w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-black font-black py-4 px-6 rounded-xl shadow-lg shadow-gold-500/20 transition-all transform hover:scale-105"
                                    >
                                        CLAIM PREMIUM SLOT NOW →
                                    </a>

                                    <p className="text-xs text-gray-500 animate-pulse">
                                        Redirecting to secure gateway...
                                    </p>
                                </motion.div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
