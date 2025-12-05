import type { MetadataRoute } from 'next'
import { getSitemapBaseUrl } from '@/utils/url'

export default function robots(): MetadataRoute.Robots {
  const base = getSitemapBaseUrl()

  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: [
      `${base}/sitemap.xml`, // Main static pages
      `${base}/sitemaps/leagues`, // League subpages (fixtures, results, standings)
      `${base}/sitemaps/teams`, // Team subpages (season, vs, etc.)
      `${base}/sitemaps/matches`, // Daily match indices (preview, stats, lineups)
      `${base}/sitemaps/country`, // Country categories
      `${base}/sitemaps/tournaments`, // Tournament categories
      `${base}/sitemaps/players`, // Player profiles
    ],
  }
}


