import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { oneTimeCodes, rateEvents, appUsers } from '@/db/schema'
import { sql, eq } from 'drizzle-orm'
import argon2 from 'argon2'
import { getEmailBaseUrl } from '@/utils/url'

function random6() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()
  if (!phone) return NextResponse.json({ ok: false }, { status: 400 })

  // simple rate limit: 3 sends per 10 minutes per phone
  const bucket = `otp:${phone}`
  await db.insert(rateEvents).values({ bucket })
  const res = await db.execute(
    sql`select count(*)::int as c from rate_events where bucket=${bucket} and created_at > now() - interval '10 minutes'`
  )
  const firstRow = (res as unknown as { rows: Array<{ c: number }> }).rows?.[0]
  const count = firstRow?.c ?? 0
  if (count > 3) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 })

  const code = random6()
  const hash = await argon2.hash(code)
  await db.insert(oneTimeCodes).values({ phone, code: hash })

  // Optional: deliver code via Telegram if bot token is configured
  const bot = process.env.TELEGRAM_BOT_TOKEN
  console.log(`🔍 Debug: TELEGRAM_BOT_TOKEN is ${bot ? 'SET' : 'NOT SET'}`)
  
  if (bot) {
    try {
      console.log(`🔍 Debug: Looking up telegram_id for phone: ${phone}`)
      
      // Look up user's telegram_id from app_users table
      const user = await db.select({ telegramId: appUsers.telegramId })
        .from(appUsers)
        .where(eq(appUsers.phone, phone))
        .limit(1)
      
      console.log(`🔍 Debug: Database query result:`, user)
      
      const userTelegramId = user[0]?.telegramId
      console.log(`🔍 Debug: User telegram_id: ${userTelegramId}`)
      
      if (userTelegramId) {
        const base = getEmailBaseUrl()
        const text = `🔐 Your Kickoff Autopilot verification code: ${code}\n\n${base}`
        
        console.log(`🔍 Debug: Sending Telegram message to chat_id: ${userTelegramId}`)
        console.log(`🔍 Debug: Message text: ${text}`)
        
        const telegramResponse = await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            chat_id: userTelegramId, 
            text,
            parse_mode: 'HTML'
          }),
        })
        
        const responseData = await telegramResponse.json()
        console.log(`🔍 Debug: Telegram API response status: ${telegramResponse.status}`)
        console.log(`🔍 Debug: Telegram API response:`, responseData)
        
        if (telegramResponse.ok) {
          console.log(`✅ Successfully sent OTP to Telegram chat ${userTelegramId}`)
        } else {
          console.error(`❌ Telegram API error:`, responseData)
        }
      } else {
        // User hasn't registered their Telegram ID yet
        console.log(`📱 User ${phone} hasn't registered their Telegram ID for OTP delivery`)
      }
    } catch (error) {
      console.error('🚨 Telegram delivery error:', error)
      // ignore delivery errors; clients can still poll verify
    }
  } else {
    console.log(`⚠️ TELEGRAM_BOT_TOKEN not configured - skipping Telegram delivery`)
  }

  // Check if user has registered their Telegram ID for better UX
  let telegramRegistered = false
  try {
    const user = await db.select({ telegramId: appUsers.telegramId })
      .from(appUsers)
      .where(eq(appUsers.phone, phone))
      .limit(1)
    telegramRegistered = user.length > 0 && !!user[0].telegramId
  } catch {
    // ignore check errors
  }

  // In development, log the code to console and include in response
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 OTP Code for ${phone}: ${code}`)
    return NextResponse.json({ 
      ok: true, 
      code, 
      dev_note: 'Code shown in development only',
      telegramRegistered
    })
  }

  // Return success with telegram registration status
  return NextResponse.json({ 
    ok: true, 
    telegramRegistered,
    message: telegramRegistered 
      ? 'OTP sent to your Telegram chat' 
      : 'OTP generated. To receive codes via Telegram, please register your Telegram ID first.'
  })
}


