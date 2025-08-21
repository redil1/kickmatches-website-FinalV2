import type { MetadataRoute } from 'next'
import { getSitemapBaseUrl } from '@/utils/url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: [`${getSitemapBaseUrl()}/sitemap.xml`],
  }
}


