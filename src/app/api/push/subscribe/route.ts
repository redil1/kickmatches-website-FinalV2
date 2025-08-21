import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { pushSubscriptions, rateEvents } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const sub = await req.json()
  const { endpoint, keys } = sub
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
  const bucket = `push:${endpoint.slice(-16)}`
  await db.insert(rateEvents).values({ bucket })
  const res = await db.execute(
    sql`select count(*)::int as c from rate_events where bucket=${bucket} and created_at > now() - interval '5 minutes'`
  )
  const firstRow = (res as unknown as { rows: Array<{ c: number }> }).rows?.[0]
  if ((firstRow?.c ?? 0) > 5) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 })
  await db.insert(pushSubscriptions).values({ endpoint, p256dh: keys.p256dh, auth: keys.auth }).onConflictDoNothing()
  return NextResponse.json({ ok: true })
}


