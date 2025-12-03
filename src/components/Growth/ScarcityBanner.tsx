'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

export default function ScarcityBanner() {
    const [slots, setSlots] = useState(14)

    useEffect(() => {
        const interval = setInterval(() => {
            setSlots(prev => {
                if (prev <= 3) return 3 // Never go below 3 to maintain credibility
                // Randomly decrease by 1 sometimes
                return Math.random() > 0.7 ? prev - 1 : prev
            })
        }, 5000)

        return () => clearInterval(interval)
    }, [])

    return (
        <div className="bg-red-600/20 border border-red-500/50 rounded-lg p-3 mb-6 flex items-center justify-center gap-3 animate-pulse">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <p className="text-sm font-medium text-white">
                High Server Load: Only <span className="font-bold text-red-400 text-lg">{slots}</span> free stream slots remaining for your region.
            </p>
        </div>
    )
}
