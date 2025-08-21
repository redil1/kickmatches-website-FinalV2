import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { sql, ilike, or, eq, and, gte, lte, lt, gt, ne, count, isNotNull } from 'drizzle-orm'
import { applyRateLimit } from '@/middleware.rate-limit'

export async function GET(request: NextRequest) {
  try {
  // Light IP-based rate limit
  const limited = await applyRateLimit(request)
  if (limited) return limited

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const league = searchParams.get('league') || ''
    const status = searchParams.get('status') || ''
    const date = searchParams.get('date') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 50
    const offset = (page - 1) * limit

    // Build filters array
    const filters = []

    // Apply search filter
    if (search) {
      filters.push(
        or(
          ilike(matches.homeTeam, `%${search}%`),
          ilike(matches.awayTeam, `%${search}%`),
          ilike(matches.league, `%${search}%`)
        )
      )
    }

    // Apply league filter
    if (league) {
      filters.push(eq(matches.league, league))
    }

    // Apply status filter
    if (status) {
      const now = new Date()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStart = today
      today.setHours(23, 59, 59, 999)
      const todayEnd = today

      switch (status) {
        case 'live':
          filters.push(eq(matches.status, 'live'))
          break
        case 'today':
          filters.push(
            and(
              gte(matches.kickoffIso, todayStart),
              lte(matches.kickoffIso, todayEnd),
              ne(matches.status, 'live')
            )
          )
          break
        case 'upcoming':
          filters.push(gt(matches.kickoffIso, todayEnd))
          break
        case 'past':
          filters.push(
            and(
              lt(matches.kickoffIso, now),
              ne(matches.status, 'live')
            )
          )
          break
      }
    }

    // Apply date filter
    if (date) {
      const selectedDate = new Date(date)
      selectedDate.setHours(0, 0, 0, 0)
      const dateStart = selectedDate
      selectedDate.setHours(23, 59, 59, 999)
      const dateEnd = selectedDate
      
      filters.push(
        and(
          gte(matches.kickoffIso, dateStart),
          lte(matches.kickoffIso, dateEnd)
        )
      )
    }

    // Build the where condition
    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    // Get matches with pagination
    const matchesData = await db
      .select()
      .from(matches)
      .where(whereCondition)
      .orderBy(matches.kickoffIso)
      .limit(limit)
      .offset(offset)

    // Get total count
    const totalCountResult = await db
      .select({ count: count() })
      .from(matches)
      .where(whereCondition)
    
    const totalMatches = totalCountResult[0]?.count || 0

    // Get unique leagues for filter options
    const leaguesData = await db
      .selectDistinct({ league: matches.league })
      .from(matches)
      .where(isNotNull(matches.league))
      .orderBy(matches.league)

    const uniqueLeagues = leaguesData.map(l => l.league).filter(Boolean)

  const res = NextResponse.json({
      matches: matchesData || [],
      totalMatches,
      leagues: uniqueLeagues,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(totalMatches / limit),
        hasNext: totalMatches > offset + limit,
        hasPrev: page > 1
      }
  })
  // Cache for 60s at edge/CDN, allow stale while revalidate
  res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return res
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}