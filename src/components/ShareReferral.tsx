"use client"

import { useCallback, useState } from 'react'

export default function ShareReferral({ slug }: { slug: string }) {
  const [code, setCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const getCode = useCallback(async () => {
    const res = await fetch('/api/referral/code', { method: 'GET' })
    const json = await res.json()
    setCode(json.referral_code)
  }, [])

  const copy = useCallback(async () => {
    if (!code) return
    const url = `${location.origin}/watch/${slug}?ref=${code}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [code, slug])

  return (
    <div className="mt-8 rounded border p-4">
      <div className="flex items-center gap-3">
        <button onClick={getCode} className="rounded bg-neutral-800 px-3 py-2 text-white">
          Get referral link
        </button>
        {code && (
          <button onClick={copy} className="rounded bg-neutral-200 px-3 py-2">
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        )}
      </div>
      {code && (
        <p className="mt-2 text-sm text-neutral-600">
          Invite 2 friends: both get +7 days. Your code: <span className="font-mono">{code}</span>
        </p>
      )}
    </div>
  )
}


