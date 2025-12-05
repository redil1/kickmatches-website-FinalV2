"use client"

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { slugify } from '@/utils/slug'

type Props = {
  items: string[]
  type: 'league' | 'team'
  baseUrl?: string
}

export default function DirectoryFilter({ items, type, baseUrl = '' }: Props) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'alpha' | 'popular'>('alpha')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = items.slice()
    if (q) list = list.filter(i => i.toLowerCase().includes(q))
    if (sort === 'alpha') list.sort((a, b) => a.localeCompare(b))
    return list
  }, [items, query, sort])


  const pricingUrl = process.env.NEXT_PUBLIC_PRICING_URL || '/pricing'

  function trackEvent(name: string, payload: Record<string, any> = {}) {
    try {
      // Push to dataLayer if available (Google Tag Manager)
      ; (window as any).dataLayer = (window as any).dataLayer || []
        ; (window as any).dataLayer.push({ event: name, ...payload })
    } catch (e) {
      // ignore
    }

    try {
      const url = (baseUrl || '') + '/api/metrics'
      const body = JSON.stringify({ event: name, payload, ts: Date.now() })
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, body)
      } else {
        fetch(url, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }).catch(() => { })
      }
    } catch (e) { }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            aria-label={`Search ${type}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${type} — e.g. 'Premier League' or 'Manchester'`}
            className="w-full sm:w-80 rounded-lg border border-gray-700 bg-black/40 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="rounded-lg border border-gray-700 bg-black/40 px-3 py-2 text-white"
            aria-label="Sort"
          >
            <option value="alpha">Sort: A → Z</option>
            <option value="popular">Sort: Popular</option>
          </select>
        </div>

        <div className="flex items-center gap-3">

          <Link href={pricingUrl} onClick={() => trackEvent('cta_click', { cta: 'pricing', source: type })} className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2 text-white font-semibold hover:bg-white/5 transition">See Plans</Link>
        </div>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((name) => {
          const slug = slugify(name)
          const href = type === 'league' ? `/leagues/${slug}` : `/teams/${slug}`

          return (
            <li key={name} className="rounded-xl border border-gold-500/10 bg-black/40 p-3 hover:border-gold-500/30 hover:bg-black/50 transition">
              <Link href={href} className="flex items-center gap-3">
                {/* Removed heavy OG image generation - use simple placeholder for better performance */}
                <div className="w-24 h-14 rounded-md bg-gradient-to-br from-gold-500/20 to-red-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">
                    {type === 'league' ? '⚽' : '🏟️'}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white truncate">{name}</div>
                  <div className="mt-1 text-xs text-gray-400">Fixtures, results & premium streams</div>
                </div>
              </Link>
            </li>
          )
        })}

        {filtered.length === 0 && (
          <li className="text-gray-400">No results. Try a simpler search or clear filters.</li>
        )}
      </ul>
    </section>
  )
}
