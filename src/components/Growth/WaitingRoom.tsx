'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Share2, Lock, Globe, Satellite, Wifi, ShieldCheck } from 'lucide-react'

interface WaitingRoomProps {
  homeTeam: string
  awayTeam: string
  kickoffIso: string
}

export default function WaitingRoom({ homeTeam, awayTeam, kickoffIso }: WaitingRoomProps) {
  const [logs, setLogs] = useState<string[]>([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('INITIALIZING')
  const [viewerCount, setViewerCount] = useState(1240)
  const logContainerRef = useRef<HTMLDivElement>(null)

  const logMessages = [
    "Establishing secure connection...",
    "Resolving DNS for p2p.secure-stream.net...",
    "Handshaking with satellite relay (SAT-4)...",
    "Bypassing geo-restrictions...",
    "Optimizing buffer size for 4K stream...",
    "Allocating bandwidth...",
    "Verifying client integrity...",
    "Connection established. Waiting for signal...",
    "Syncing with broadcast server...",
    "Buffering pre-match content..."
  ]

  useEffect(() => {
    let currentLogIndex = 0
    
    const interval = setInterval(() => {
      if (currentLogIndex < logMessages.length) {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${logMessages[currentLogIndex]}`])
        setProgress(prev => Math.min(prev + 10, 95))
        currentLogIndex++
      } else {
        setStatus('READY')
        clearInterval(interval)
      }
    }, 1500)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  // Fake viewer count fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 2)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-4xl mx-auto bg-black border border-green-500/30 rounded-xl overflow-hidden font-mono shadow-[0_0_50px_rgba(34,197,94,0.1)]">
      {/* Terminal Header */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-green-500/30">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="ml-2 text-green-500 text-xs">SECURE_TERMINAL_V2.0</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-green-400">
          <span className="flex items-center gap-1">
            <Wifi className="w-3 h-3 animate-pulse" /> 
            CONNECTED
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> 
            ENCRYPTED
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 grid md:grid-cols-2 gap-8 relative">
        {/* Scanlines Effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />

        {/* Left Column: Status & Map */}
        <div className="space-y-6">
          <div className="border border-green-500/30 p-4 rounded bg-black/50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-500 text-sm">SIGNAL STRENGTH</span>
              <span className="text-green-400 font-bold">98%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-green-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <div className="relative h-48 border border-green-500/30 rounded bg-black/50 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 opacity-20 animate-[spin_10s_linear_infinite]">
              <Globe className="w-full h-full text-green-500" />
            </div>
            <Satellite className="w-12 h-12 text-green-400 animate-bounce relative z-10" />
            <div className="absolute bottom-2 right-2 text-xs text-green-500">
              RELAY: EU-WEST-1
            </div>
          </div>

          <div className="flex items-center justify-between text-green-500 text-sm">
            <span>VIEWERS WAITING:</span>
            <span className="font-bold tabular-nums">{viewerCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Right Column: Logs */}
        <div className="border border-green-500/30 rounded bg-black/80 p-4 h-80 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto font-mono text-xs space-y-1" ref={logContainerRef}>
            {logs.map((log, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-green-400"
              >
                <span className="text-green-600">{'>'}</span> {log}
              </motion.div>
            ))}
            {status !== 'READY' && (
              <motion.div 
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-2 h-4 bg-green-500 inline-block ml-1"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t border-green-500/30 p-4 bg-gray-900/50">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">
            Estimated wait time: <span className="text-white">Calculating...</span>
          </div>
          <button className="bg-green-600 hover:bg-green-500 text-black font-bold py-2 px-6 rounded text-sm flex items-center gap-2 transition-colors">
            <Share2 className="w-4 h-4" />
            BOOST CONNECTION SPEED
          </button>
        </div>
      </div>
    </div>
  )
}
