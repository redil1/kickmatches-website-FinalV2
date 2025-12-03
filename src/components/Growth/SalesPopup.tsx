'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, CheckCircle } from 'lucide-react'

const NAMES = ['John D.', 'Sarah M.', 'Michael R.', 'David K.', 'Emma S.', 'James L.', 'Robert P.', 'Jennifer W.']
const CITIES = ['London', 'New York', 'Manchester', 'Liverpool', 'Madrid', 'Barcelona', 'Paris', 'Berlin', 'Rome']
const PRODUCTS = ['Premium Monthly', 'Annual Pass', 'Premium Monthly', 'Premium Monthly']

export default function SalesPopup() {
    const [isVisible, setIsVisible] = useState(false)
    const [data, setData] = useState({ name: '', city: '', product: '' })

    useEffect(() => {
        const showPopup = () => {
            const name = NAMES[Math.floor(Math.random() * NAMES.length)]
            const city = CITIES[Math.floor(Math.random() * CITIES.length)]
            const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)]

            setData({ name, city, product })
            setIsVisible(true)

            // Hide after 5 seconds
            setTimeout(() => setIsVisible(false), 5000)
        }

        // Initial delay
        const initialTimer = setTimeout(showPopup, 10000)

        // Recurring loop
        const loopTimer = setInterval(() => {
            if (!document.hidden) { // Only show if tab is active
                showPopup()
            }
        }, 20000 + Math.random() * 10000) // Random interval 20-30s

        return () => {
            clearTimeout(initialTimer)
            clearInterval(loopTimer)
        }
    }, [])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, x: -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, y: 20, x: -20 }}
                    className="fixed bottom-4 left-4 z-50 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 shadow-2xl max-w-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-green-500/20 p-3 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-white font-medium">
                                <span className="font-bold text-gold-400">{data.name}</span> from {data.city}
                            </p>
                            <p className="text-xs text-gray-300 mt-1">
                                Just purchased <span className="font-bold text-white">{data.product}</span>
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                Verified Purchase • Just now
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
