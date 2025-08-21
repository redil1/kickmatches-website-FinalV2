import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { appUsers } from '@/db/schema'
import { randomBytes } from 'crypto'

function genCode() {
  return randomBytes(6).toString('hex')
}

export async function POST(req: NextRequest) {
  const { phone } = (await req.json().catch(() => ({}))) as { phone?: string }
  const code = genCode()
  await db
    .insert(appUsers)
    .values({ phone: phone || undefined as any, referralCode: code })
    .onConflictDoNothing()
  return NextResponse.json({ referral_code: code })
}

export async function GET() {
  // Convenience getter that always returns a fresh code
  const code = genCode()
  await db.insert(appUsers).values({ referralCode: code }).onConflictDoNothing()
  return NextResponse.json({ referral_code: code })
}


