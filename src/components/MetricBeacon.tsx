"use client"

import { useEffect } from 'react'

type Props = {
  event: string
  payload?: Record<string, unknown>
}

export default function MetricBeacon({ event, payload }: Props) {
  useEffect(() => {
    try {
      const body = JSON.stringify({ event, payload })
      if ('sendBeacon' in navigator) {
        navigator.sendBeacon('/api/metrics', body)
      } else {
        fetch('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        })
      }
    } catch {
      // ignore
    }
  }, [event, payload])
  return null
}


