import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { appUsers } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { phone, telegramId, telegramUsername } = await req.json()
    
    if (!phone || !telegramId) {
      return NextResponse.json(
        { ok: false, error: 'Phone number and Telegram ID are required' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(appUsers)
      .where(eq(appUsers.phone, phone))
      .limit(1)

    if (existingUser.length > 0) {
      // Update existing user's telegram_id
      await db.update(appUsers)
        .set({ telegramId })
        .where(eq(appUsers.phone, phone))
    } else {
      // Create new user record
      await db.insert(appUsers).values({
        phone,
        telegramId
      })
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'Telegram ID registered successfully. You will now receive OTP codes via Telegram.' 
    })
  } catch (error) {
    console.error('Telegram registration error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to register Telegram ID' },
      { status: 500 }
    )
  }
}

// GET endpoint to check if user has registered their Telegram ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const phone = searchParams.get('phone')
    
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    const user = await db.select({ telegramId: appUsers.telegramId })
      .from(appUsers)
      .where(eq(appUsers.phone, phone))
      .limit(1)

    const hasRegistered = user.length > 0 && user[0].telegramId

    return NextResponse.json({ 
      ok: true, 
      hasRegistered,
      telegramId: hasRegistered ? user[0].telegramId : null
    })
  } catch (error) {
    console.error('Telegram check error:', error)
    return NextResponse.json(
      { ok: false, error: 'Failed to check Telegram registration' },
      { status: 500 }
    )
  }
}