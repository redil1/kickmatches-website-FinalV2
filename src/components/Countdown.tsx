"use client"

import { useEffect, useState } from 'react'
import ClientOnly from './ClientOnly'

export default function Countdown({ to }: { to: string }) {
  const [left, setLeft] = useState<number>(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const updateTime = () => setLeft(new Date(to).getTime() - Date.now())
    updateTime() // Initial calculation
    const id = setInterval(updateTime, 1000)
    return () => clearInterval(id)
  }, [to])

  const totalSeconds = Math.floor(left / 1000)
  const days = Math.floor(totalSeconds / (3600 * 24))
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const timeUnits = [
    { value: days, label: 'DAYS', show: days > 0 },
    { value: hours, label: 'HOURS', show: true },
    { value: minutes, label: 'MINS', show: true },
    { value: seconds, label: 'SECS', show: true }
  ].filter(unit => unit.show)

  return (
    <ClientOnly fallback={
      <div className="flex items-center justify-center gap-4">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 rounded-lg p-4 min-w-[80px] shadow-lg">
          <div className="text-3xl md:text-4xl font-black text-white text-center font-mono">
            --
          </div>
        </div>
      </div>
    }>
      {mounted && (
        left <= 0 ? (
          <div className="flex items-center justify-center gap-2 animate-pulse">
            <span className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xl">
              🔴 LIVE NOW
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4">
            {timeUnits.map((unit, index) => (
              <div key={unit.label} className="flex flex-col items-center">
                <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-600 rounded-lg p-4 min-w-[80px] shadow-lg">
                  <div className="text-3xl md:text-4xl font-black text-white text-center font-mono">
                    {unit.value.toString().padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-300 mt-2 tracking-wider">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </ClientOnly>
  )
}


