import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { getSitemapBaseUrl, createSitemapUrl } from '@/utils/url'

// Force regeneration every 60 seconds
export const revalidate = 60

// URL-safe slug generation without XML escaping (Next.js handles XML automatically)
function createUrlSafeSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headersList = await headers()
  const host = headersList.get('host') || undefined
  const base = getSitemapBaseUrl(host)
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  let allMatches: any[] = []

  try {
    // Get all matches with their kickoff times
    console.log('Sitemap: Attempting to fetch matches from database...')
    allMatches = await db.select({
      slug: matches.slug,
      kickoffIso: matches.kickoffIso,
      league: matches.league,
      homeTeam: matches.homeTeam,
      awayTeam: matches.awayTeam,
      eventId: matches.eventId,
    }).from(matches)
    console.log(`Sitemap: Successfully fetched ${allMatches.length} matches`)
  } catch (error) {
    // Database not available during build - return basic sitemap
    console.error('Sitemap: Database error during sitemap generation:', error)
    console.warn('Database not available during sitemap generation, returning basic sitemap')
    allMatches = []
  }

  const sitemapEntries: MetadataRoute.Sitemap = [
    // Homepage - highest priority
    {
      url: base,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 1.0
    },

    // Main pages
    {
      url: `${base}/matches`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.9
    },
    {
      url: `${base}/live`,
      lastModified: now,
      changeFrequency: 'always',
      priority: 0.9
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8
    }
  ]

  // Add index pages for discovery
  sitemapEntries.push(
    {
      url: `${base}/leagues`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.8,
    },
    {
      url: `${base}/teams`,
      lastModified: now,
      changeFrequency: 'hourly',
      priority: 0.7,
    },
  )

  // Add match pages with dynamic priorities
  allMatches.forEach((match) => {
    const kickoff = new Date(match.kickoffIso as string)
    const isLive = now >= kickoff && now <= new Date(kickoff.getTime() + 120 * 60 * 1000)
    const isUpcoming = now < kickoff
    const isToday = kickoff.toISOString().split('T')[0] === today
    const isThisWeek = kickoff.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000

    // Dynamic priority based on match timing and importance
    let priority = 0.5
    let changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' = 'daily'

    if (isLive) {
      priority = 0.95
      changeFrequency = 'always'
    } else if (isToday) {
      priority = 0.9
      changeFrequency = 'hourly'
    } else if (isUpcoming && isThisWeek) {
      priority = 0.8
      changeFrequency = 'hourly'
    } else if (isUpcoming) {
      priority = 0.7
      changeFrequency = 'daily'
    } else {
      // Past matches (highlights)
      priority = 0.6
      changeFrequency = 'weekly'
    }

    // Boost priority for major leagues
    const majorLeagues = ['Premier League', 'Champions League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1']
    if (majorLeagues.includes(match.league as string)) {
      priority = Math.min(priority + 0.1, 1.0)
    }

    // Canonical event detail page if eventId exists
    if (match.eventId) {
      sitemapEntries.push({
        url: createSitemapUrl(`/m/${match.eventId}-${match.slug}`, host),
        lastModified: isLive ? now : kickoff,
        changeFrequency,
        priority: Math.min((priority || 0.5) + 0.05, 1.0),
      })
    }
    // Keep watch page as well
    sitemapEntries.push({
      url: createSitemapUrl(`/watch/${match.slug}`, host),
      lastModified: isLive ? now : kickoff,
      changeFrequency,
      priority
    })
  })

  // Note: Team and league pages removed as they don't exist in the app structure

  return sitemapEntries.sort((a, b) => (b.priority || 0) - (a.priority || 0))
}


