import { NextResponse } from 'next/server'
import { pool } from '@/db/client'

export async function GET() {
  try {
    console.log('Testing database connection...')
    
    // Test basic connectivity
    const connectTest = await pool.query('SELECT 1 as test')
    console.log('Basic connectivity test:', connectTest.rows)
    
    // Test the specific query
    const upcomingTest = await pool.query(`
      SELECT COUNT(*) as count
      FROM matches 
      WHERE kickoff_iso > NOW()
    `)
    console.log('Upcoming matches count:', upcomingTest.rows)
    
    // Test the full query
    const fullTest = await pool.query(`
      SELECT id, slug, home_team, away_team, league, kickoff_iso, status
      FROM matches 
      WHERE kickoff_iso > NOW() 
      ORDER BY kickoff_iso ASC 
      LIMIT 5
    `)
    console.log('Full query test:', fullTest.rows)
    
    return NextResponse.json({
      success: true,
      basicTest: connectTest.rows,
      countTest: upcomingTest.rows,
      fullTest: fullTest.rows
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 })
  }
}