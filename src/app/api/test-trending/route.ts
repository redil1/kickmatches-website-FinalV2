import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../db/client'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    console.log('Testing database connection from API endpoint...')
    
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM trending_players`)
    console.log('Trending players count:', result.rows[0])
    
    const playersResult = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.position,
        p.jersey_number,
        tp.rating,
        tp.event_id
      FROM trending_players tp
      JOIN players p ON tp.player_id = p.id
      ORDER BY tp.rating DESC
      LIMIT 3
    `)
    
    console.log('Query successful, got', playersResult.rows.length, 'players')
    
    return NextResponse.json({
      success: true,
      count: result.rows[0],
      players: playersResult.rows
    })
  } catch (error) {
    console.error('Database test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
