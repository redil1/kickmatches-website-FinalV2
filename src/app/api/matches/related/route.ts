import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { eq, sql, and, or, ne } from 'drizzle-orm'
import { applyRateLimit } from '@/middleware.rate-limit'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
  const limited = await applyRateLimit(request)
  if (limited) return limited
    const { searchParams } = request.nextUrl
    const slug = searchParams.get('slug')
    const league = searchParams.get('league')
    const teams = searchParams.get('teams')?.split(',') || []
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
    }

    // Get related matches based on multiple criteria
    const relatedMatches = await db.select({
      slug: matches.slug,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      league: matches.league,
      kickoffIso: matches.kickoffIso,
      status: matches.status
    })
    .from(matches)
    .where(
      and(
        ne(matches.slug, slug), // Exclude current match
        or(
          // Same league
          league ? eq(matches.league, league) : sql`1=0`,
          // Same teams (either home or away)
          teams.length > 0 ? or(
            sql`home_team = ANY(ARRAY[${teams.map(team => `'${team.replace(/'/g, "''")}'`).join(',')}])`,
            sql`away_team = ANY(ARRAY[${teams.map(team => `'${team.replace(/'/g, "''")}'`).join(',')}])`
          ) : sql`1=0`,
          // Today's matches
          sql`DATE(kickoff_iso) = DATE(NOW())`
        )
      )
    )
    .orderBy(
      // Prioritize: 1) Live matches, 2) Same league, 3) Same teams, 4) Today's matches
      sql`
        CASE 
          WHEN status = 'live' THEN 1
          WHEN league = ${league || ''} THEN 2
          WHEN (home_team = ANY(ARRAY[${teams.map(team => `'${team.replace(/'/g, "''")}'`).join(',')}]) OR away_team = ANY(ARRAY[${teams.map(team => `'${team.replace(/'/g, "''")}'`).join(',')}])) THEN 3
          WHEN DATE(kickoff_iso) = DATE(NOW()) THEN 4
          ELSE 5
        END,
        kickoff_iso ASC
      `
    )
    .limit(8)

    // Add semantic scoring for better relevance
    const scoredMatches = relatedMatches.map(match => {
      let score = 0
      
      // Boost score for same league
      if (match.league === league) score += 10
      
      // Boost score for same teams
      if (teams.includes(match.homeTeam) || teams.includes(match.awayTeam)) score += 8
      
      // Boost score for live matches
      if (match.status === 'live') score += 15
      
      // Boost score for today's matches
      const matchDate = new Date(match.kickoffIso as unknown as string).toDateString()
      const today = new Date().toDateString()
      if (matchDate === today) score += 5
      
      return { ...match, relevanceScore: score }
    })

    // Sort by relevance score and return top matches
    const sortedMatches = scoredMatches
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 6)
      .map(({ relevanceScore, ...match }) => match) // Remove score from response

    return NextResponse.json({
      matches: sortedMatches,
      total: sortedMatches.length
    })
    
  } catch (error) {
    console.error('Error fetching related matches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch related matches' },
      { status: 500 }
    )
  }
}

// Cache the response for 5 minutes
export const revalidate = 300