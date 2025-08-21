import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { db } from '@/db/client'
import { pushSubscriptions } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const { secret, title, body, url } = await req.json()
  if (secret !== process.env.PUSH_API_SECRET) return NextResponse.json({ ok: false }, { status: 401 })
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ ok: false, error: 'VAPID not configured' }, { status: 500 })
  }
  webpush.setVapidDetails('mailto:admin@kickai.matches', process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)
  const subs = await db.select().from(pushSubscriptions)
  let success = 0
  let removed = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } } as unknown as WebPushSubscription,
          JSON.stringify({ title, body, url })
        )
        success += 1
      } catch (err: any) {
        const statusCode = err?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          // prune stale subscription
          await db.execute(sql`delete from push_subscriptions where endpoint = ${s.endpoint}`)
          removed += 1
        }
      }
    })
  )
  return NextResponse.json({ ok: true, count: subs.length, sent: success, pruned: removed })
}


