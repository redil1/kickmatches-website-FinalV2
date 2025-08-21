import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { metrics } from '@/db/schema'

export async function POST(req: NextRequest) {
  const { event, payload } = await req.json()
  if (!event) return NextResponse.json({ ok: false }, { status: 400 })
  try {
    await db.insert(metrics).values({ event, payload })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('metrics insert failed', e)
    // Don’t block client if DB is down
    return NextResponse.json({ ok: true, degraded: true })
  }
}


