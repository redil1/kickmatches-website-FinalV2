import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { oneTimeCodes, rateEvents } from '@/db/schema'
import { sql } from 'drizzle-orm'
import argon2 from 'argon2'

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()
  if (!phone || !code) return NextResponse.json({ ok: false }, { status: 400 })

  // simple rate limit: 5 verifies per 10 minutes per phone
  const bucket = `otp-verify:${phone}`
  await db.insert(rateEvents).values({ bucket })
  const vres = await db.execute(
    sql`select count(*)::int as c from rate_events where bucket=${bucket} and created_at > now() - interval '10 minutes'`
  )
  const vrow = (vres as any).rows?.[0]
  if ((vrow?.c ?? 0) > 5) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 })

  const res = await db.execute(
    sql`select id, created_at, code from one_time_codes where phone=${phone} and consumed=false order by created_at desc limit 5`
  )
  const row = (res as unknown as { rows: Array<{ id: string; created_at: string }> }).rows?.[0]
  if (!row) return NextResponse.json({ ok: false }, { status: 400 })
  // Ensure age <= 10 minutes
  const createdAt = new Date((row as any).created_at)
  if (Date.now() - createdAt.getTime() > 10 * 60 * 1000) {
    return NextResponse.json({ ok: false, error: 'expired' }, { status: 400 })
  }

  // verify against recent hashes
  const candidates = (res as any).rows as Array<{ id: string; code: string }>
  let matched: string | null = null
  for (const c of candidates) {
    if (await argon2.verify(c.code, code)) {
      matched = c.id
      break
    }
  }
  if (!matched) return NextResponse.json({ ok: false }, { status: 400 })

  await db.update(oneTimeCodes).set({ consumed: true }).where(sql`id = ${matched}` as any)

  return NextResponse.json({ ok: true })
}


