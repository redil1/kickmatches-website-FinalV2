import { NextRequest, NextResponse } from 'next/server'
import { queues } from '@/worker/queue'

async function handleRequest(req: NextRequest) {
  // In dev, allow without secret for convenience
  const isDev = process.env.NODE_ENV !== 'production'

  // Accept secret via header or query param or JSON body (only required in prod)
  const url = new URL(req.url)
  const headerSecret = req.headers.get('x-admin-secret')
  const querySecret = url.searchParams.get('secret')

  // Only try to read body for POST requests
  let bodySecret = null
  if (req.method === 'POST') {
    bodySecret = (await req.json().catch(() => ({})))?.secret
  }

  const secret = headerSecret || querySecret || bodySecret

  if (!isDev) {
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }
  }

  await queues.alert.add('tick', {}, { removeOnComplete: true })
  return NextResponse.json({ ok: true, enqueued: 'pmm-alert:tick' })
}

export async function POST(req: NextRequest) {
  return handleRequest(req)
}

export async function GET(req: NextRequest) {
  return handleRequest(req)
}