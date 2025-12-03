import { format } from 'date-fns'

interface MatchData {
  slug: string
  homeTeam: string
  awayTeam: string
  league: string
  kickoffIso: string
  status?: string
  scorebatEmbed?: string
}

interface SEOData {
  title: string
  description: string
  keywords: string[]
  canonicalUrl: string
  structuredData: any[]
  openGraph: any
  twitter: any
  breadcrumbs: any
  faq: any
}

export function generateMatchSEO(match: MatchData, baseUrl: string): SEOData {
  const kickoff = new Date(match.kickoffIso)
  const isLive = new Date() >= kickoff && new Date() <= new Date(kickoff.getTime() + 120 * 60 * 1000)
  const isUpcoming = new Date() < kickoff
  const matchDate = format(kickoff, 'PPP')
  const matchTime = format(kickoff, 'p')

  // Generate semantic keywords
  const keywords = [
    `${match.homeTeam} vs ${match.awayTeam}`,
    `${match.homeTeam} ${match.awayTeam} live stream`,
    `${match.league} live`,
    `${match.homeTeam} live stream`,
    `${match.awayTeam} live stream`,
    `football live stream`,
    `soccer live stream`,
    `${match.league} ${matchDate}`,
    `watch ${match.homeTeam} online`,
    `watch ${match.awayTeam} online`,
    `${match.homeTeam} ${match.awayTeam} highlights`,
    `${match.league} streaming`,
    'IPTV football',
    'live sports streaming',
    '4K football stream',
    'premium sports channels',
    'football match today',
    isLive ? 'live now' : isUpcoming ? 'upcoming match' : 'match highlights'
  ]

  const title = isLive
    ? `🔴 LIVE: ${match.homeTeam} vs ${match.awayTeam} | ${match.league} Live Stream Free`
    : isUpcoming
      ? `Watch ${match.homeTeam} vs ${match.awayTeam} Live | ${match.league} Free IPTV Trial`
      : `${match.homeTeam} vs ${match.awayTeam} Highlights | ${match.league} Premium IPTV`

  const description = isLive
    ? `Watch ${match.homeTeam} vs ${match.awayTeam} LIVE NOW in 4K quality! ${match.league} live stream with instant access. Premium IPTV streaming - no credit card required.`
    : isUpcoming
      ? `Watch ${match.homeTeam} vs ${match.awayTeam} live on ${matchDate} at ${matchTime}. Premium ${match.league} streaming in 4K. Free 12-hour IPTV trial - instant access!`
      : `Watch ${match.homeTeam} vs ${match.awayTeam} full match highlights. ${match.league} premium coverage with 4K quality and expert commentary.`

  const canonicalUrl = `${baseUrl}/watch/${match.slug}`

  // Comprehensive Structured Data
  const structuredData = [
    // BroadcastEvent Schema
    {
      '@context': 'https://schema.org',
      '@type': 'BroadcastEvent',
      '@id': `${canonicalUrl}#broadcast`,
      name: `${match.homeTeam} vs ${match.awayTeam} Live Broadcast`,
      description: description,
      startDate: kickoff.toISOString(),
      endDate: new Date(kickoff.getTime() + 120 * 60 * 1000).toISOString(),
      isLiveBroadcast: isLive,
      broadcastOfEvent: {
        '@type': 'SportsEvent',
        '@id': `${canonicalUrl}#event`,
        name: `${match.homeTeam} vs ${match.awayTeam}`,
        description: `${match.league} match between ${match.homeTeam} and ${match.awayTeam}`,
        startDate: kickoff.toISOString(),
        endDate: new Date(kickoff.getTime() + 120 * 60 * 1000).toISOString(),
        sport: {
          '@type': 'Sport',
          name: 'Association Football',
          alternateName: 'Soccer'
        },
        homeTeam: {
          '@type': 'SportsTeam',
          '@id': `${baseUrl}/teams/${match.homeTeam.toLowerCase().replace(/\s+/g, '-')}`,
          name: match.homeTeam,
          sport: 'Association Football',
          memberOf: {
            '@type': 'SportsOrganization',
            name: match.homeTeam.includes('Inter Miami') ? 'Major League Soccer' :
              match.homeTeam.includes('FC Barcelona') ? 'La Liga' :
                match.homeTeam.includes('Manchester') ? 'Premier League' : 'Professional Football League'
          },
          athlete: match.homeTeam.includes('Inter Miami') ? [
            {
              '@type': 'Person',
              name: 'Lionel Messi',
              jobTitle: 'Forward',
              nationality: 'Argentina'
            },
            {
              '@type': 'Person',
              name: 'Jordi Alba',
              jobTitle: 'Defender',
              nationality: 'Spain'
            },
            {
              '@type': 'Person',
              name: 'Sergio Busquets',
              jobTitle: 'Midfielder',
              nationality: 'Spain'
            }
          ] : [
            {
              '@type': 'Person',
              name: 'Star Player',
              jobTitle: 'Forward'
            }
          ],
          coach: {
            '@type': 'Person',
            name: match.homeTeam.includes('Inter Miami') ? 'Gerardo Martino' : 'Head Coach',
            jobTitle: 'Head Coach'
          }
        },
        awayTeam: {
          '@type': 'SportsTeam',
          '@id': `${baseUrl}/teams/${match.awayTeam.toLowerCase().replace(/\s+/g, '-')}`,
          name: match.awayTeam,
          sport: 'Association Football',
          memberOf: {
            '@type': 'SportsOrganization',
            name: match.awayTeam.includes('Tigres') ? 'Liga MX' :
              match.awayTeam.includes('Real Madrid') ? 'La Liga' :
                match.awayTeam.includes('Liverpool') ? 'Premier League' : 'Professional Football League'
          },
          athlete: match.awayTeam.includes('Tigres') ? [
            {
              '@type': 'Person',
              name: 'André-Pierre Gignac',
              jobTitle: 'Forward',
              nationality: 'France'
            },
            {
              '@type': 'Person',
              name: 'Nahuel Guzmán',
              jobTitle: 'Goalkeeper',
              nationality: 'Argentina'
            },
            {
              '@type': 'Person',
              name: 'Diego Reyes',
              jobTitle: 'Defender',
              nationality: 'Mexico'
            }
          ] : [
            {
              '@type': 'Person',
              name: 'Star Player',
              jobTitle: 'Forward'
            }
          ],
          coach: {
            '@type': 'Person',
            name: match.awayTeam.includes('Tigres') ? 'Robert Dante Siboldi' : 'Head Coach',
            jobTitle: 'Head Coach'
          }
        },
        competitor: [
          {
            '@type': 'SportsTeam',
            name: match.homeTeam,
            sport: 'Football'
          },
          {
            '@type': 'SportsTeam',
            name: match.awayTeam,
            sport: 'Football'
          }
        ],
        location: {
          '@type': 'StadiumOrArena',
          name: match.homeTeam.includes('Inter Miami') ? 'DRV PNK Stadium' : `${match.homeTeam} Stadium`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: match.homeTeam.includes('Inter Miami') ? 'Fort Lauderdale' : 'Unknown',
            addressRegion: match.homeTeam.includes('Inter Miami') ? 'FL' : 'Unknown',
            addressCountry: match.homeTeam.includes('Inter Miami') ? 'US' : 'GB'
          },
          maximumAttendeeCapacity: match.homeTeam.includes('Inter Miami') ? 18000 : 50000
        },
        organizer: {
          '@type': 'Organization',
          name: match.league,
          sport: 'Football'
        }
      },
      videoFormat: 'application/x-mpegURL',
      encodingFormat: 'video/mp4',
      embedUrl: canonicalUrl,
      broadcastDisplayName: `🔴 LIVE: ${match.homeTeam} vs ${match.awayTeam} - Free Stream`,
      broadcaster: {
        '@type': 'Organization',
        name: 'Kick AI of Matches',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`
      }
    },

    // VideoObject Schema
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      '@id': `${canonicalUrl}#video`,
      name: `${match.homeTeam} vs ${match.awayTeam} ${isLive ? 'Live Stream' : isUpcoming ? 'Preview' : 'Highlights'}`,
      description: description,
      thumbnailUrl: `${baseUrl}/api/og?home=${encodeURIComponent(match.homeTeam)}&away=${encodeURIComponent(match.awayTeam)}&league=${encodeURIComponent(match.league)}`,
      uploadDate: kickoff.toISOString(),
      duration: isLive ? 'PT120M' : 'PT10M',
      contentUrl: canonicalUrl,
      embedUrl: canonicalUrl,
      publisher: {
        '@type': 'Organization',
        name: 'Kick AI of Matches',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`
        }
      },
      isLiveBroadcast: isLive,
      publication: {
        '@type': 'BroadcastEvent',
        isLiveBroadcast: isLive,
        startDate: kickoff.toISOString()
      },
      potentialAction: {
        '@type': 'WatchAction',
        target: canonicalUrl
      }
    },

    // WebPage Schema
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: title,
      description: description,
      inLanguage: 'en-US',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${baseUrl}#website`,
        url: baseUrl,
        name: 'Kick AI of Matches',
        description: 'Premium IPTV Sports Streaming Platform',
        publisher: {
          '@type': 'Organization',
          name: 'Kick AI of Matches'
        }
      },
      primaryImageOfPage: {
        '@type': 'ImageObject',
        url: `${baseUrl}/api/og?home=${encodeURIComponent(match.homeTeam)}&away=${encodeURIComponent(match.awayTeam)}&league=${encodeURIComponent(match.league)}`
      },
      datePublished: new Date(kickoff.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      dateModified: new Date().toISOString(),
      breadcrumb: {
        '@type': 'BreadcrumbList',
        '@id': `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: baseUrl
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Live Matches',
            item: `${baseUrl}/live`
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: `${match.homeTeam} vs ${match.awayTeam}`,
            item: canonicalUrl
          }
        ]
      },
      mainEntity: {
        '@id': `${canonicalUrl}#event`
      },
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['.live-score', '.team-stats', '.match-time']
      }
    },

    // Organization Schema
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${baseUrl}#organization`,
      name: 'Kick AI of Matches',
      url: baseUrl,
      logo: `${baseUrl}/logo.png`,
      description: 'Premium IPTV Sports Streaming Platform with 15,000+ live channels',
      sameAs: [
        'https://twitter.com/kickaimatches',
        'https://facebook.com/kickaimatches',
        'https://instagram.com/kickaimatches'
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+1-234-567-890',
        contactType: 'customer service',
        email: 'support@kickmatches.com'
      }
    },

    // ItemList for Team Lineups (Home Team)
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#lineup-home`,
      name: `${match.homeTeam} Starting Lineup`,
      description: `Starting eleven and formation for ${match.homeTeam} in today's match`,
      itemListElement: match.homeTeam.includes('Inter Miami') ? [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Person',
            name: 'Drake Callender',
            jobTitle: 'Goalkeeper'
          }
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'Person',
            name: 'Jordi Alba',
            jobTitle: 'Defender'
          }
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@type': 'Person',
            name: 'Lionel Messi',
            jobTitle: 'Forward'
          }
        }
      ] : [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Person',
            name: 'Starting Goalkeeper',
            jobTitle: 'Goalkeeper'
          }
        }
      ]
    },

    // ItemList for Team Lineups (Away Team)
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      '@id': `${canonicalUrl}#lineup-away`,
      name: `${match.awayTeam} Starting Lineup`,
      description: `Starting eleven and formation for ${match.awayTeam} in today's match`,
      itemListElement: match.awayTeam.includes('Tigres') ? [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Person',
            name: 'Nahuel Guzmán',
            jobTitle: 'Goalkeeper'
          }
        },
        {
          '@type': 'ListItem',
          position: 2,
          item: {
            '@type': 'Person',
            name: 'Diego Reyes',
            jobTitle: 'Defender'
          }
        },
        {
          '@type': 'ListItem',
          position: 3,
          item: {
            '@type': 'Person',
            name: 'André-Pierre Gignac',
            jobTitle: 'Forward'
          }
        }
      ] : [
        {
          '@type': 'ListItem',
          position: 1,
          item: {
            '@type': 'Person',
            name: 'Starting Goalkeeper',
            jobTitle: 'Goalkeeper'
          }
        }
      ]
    },

    // Event Schema for Tournament Context
    {
      '@context': 'https://schema.org',
      '@type': 'Event',
      '@id': `${canonicalUrl}#tournament`,
      name: match.league,
      description: `Professional football tournament featuring ${match.homeTeam} vs ${match.awayTeam}`,
      startDate: kickoff.toISOString(),
      endDate: new Date(kickoff.getTime() + 120 * 60 * 1000).toISOString(),
      organizer: {
        '@type': 'SportsOrganization',
        name: match.league.includes('Champions League') ? 'UEFA' :
          match.league.includes('Leagues Cup') ? 'CONCACAF' :
            match.league.includes('Premier League') ? 'Premier League' : 'Football Association'
      },
      location: {
        '@type': 'StadiumOrArena',
        name: match.homeTeam.includes('Inter Miami') ? 'DRV PNK Stadium' : `${match.homeTeam} Stadium`,
        address: {
          '@type': 'PostalAddress',
          addressLocality: match.homeTeam.includes('Inter Miami') ? 'Fort Lauderdale' : 'Unknown',
          addressRegion: match.homeTeam.includes('Inter Miami') ? 'FL' : 'Unknown',
          addressCountry: match.homeTeam.includes('Inter Miami') ? 'US' : 'GB'
        }
      }
    }
  ]

  // Add FAQ Schema if not live
  if (!isLive) {
    structuredData.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      '@id': `${canonicalUrl}#faq`,
      mainEntity: [
        {
          '@type': 'Question',
          name: `How can I watch ${match.homeTeam} vs ${match.awayTeam} live?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `You can watch ${match.homeTeam} vs ${match.awayTeam} live on our premium IPTV platform. Start your 12-hour free trial to access 15,000+ live sports channels in 4K quality.`
          }
        },
        {
          '@type': 'Question',
          name: `What time does ${match.homeTeam} vs ${match.awayTeam} start?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `${match.homeTeam} vs ${match.awayTeam} starts on ${matchDate} at ${matchTime}. The match is part of the ${match.league} competition.`
          }
        },
        {
          '@type': 'Question',
          name: 'Is there a free trial available?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes! We offer a 12-hour free trial with full access to all premium sports channels. No credit card required to start your trial.'
          }
        },
        {
          '@type': 'Question',
          name: 'What quality is the live stream?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'All our live streams are available in stunning 4K Ultra HD quality with multiple camera angles and expert commentary.'
          }
        }
      ]
    } as any)
  }

  // Breadcrumb Schema
  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Live Matches',
        item: `${baseUrl}/matches`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: match.league,
        item: `${baseUrl}/league/${match.league.toLowerCase().replace(/\s+/g, '-')}`
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: `${match.homeTeam} vs ${match.awayTeam}`,
        item: canonicalUrl
      }
    ]
  }

  // Dynamic Open Graph image URL
  const ogImageUrl = `${baseUrl}/api/og?home=${encodeURIComponent(match.homeTeam)}&away=${encodeURIComponent(match.awayTeam)}&league=${encodeURIComponent(match.league)}&live=${isLive}&date=${encodeURIComponent(new Date(match.kickoffIso).toLocaleDateString())}`;

  // Open Graph
  const openGraph = {
    title: title,
    description: description,
    url: canonicalUrl,
    type: 'video.other',
    siteName: 'Kick AI of Matches',
    locale: 'en_US',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: `${match.homeTeam} vs ${match.awayTeam} - ${match.league}`
      }
    ],
    videos: match.scorebatEmbed ? [
      {
        url: canonicalUrl,
        type: 'text/html',
        width: 1280,
        height: 720
      }
    ] : undefined
  }

  // Twitter Card
  const twitter = {
    card: 'summary_large_image',
    site: '@kickaimatches',
    creator: '@kickaimatches',
    title: title.length > 70 ? title.substring(0, 67) + '...' : title,
    description: description.length > 200 ? description.substring(0, 197) + '...' : description,
    image: ogImageUrl,
    imageAlt: `${match.homeTeam} vs ${match.awayTeam} - ${match.league}`
  }

  return {
    title,
    description,
    keywords,
    canonicalUrl,
    structuredData,
    openGraph,
    twitter,
    breadcrumbs,
    faq: structuredData.find(item => item['@type'] === 'FAQPage')
  }
}

// Generate semantic keywords for better SEO
export function generateSemanticKeywords(match: MatchData): string[] {
  const base = [
    match.homeTeam,
    match.awayTeam,
    match.league,
    'live stream',
    'watch online',
    'football',
    'soccer',
    'IPTV',
    '4K stream'
  ]

  const combinations = []
  for (let i = 0; i < base.length; i++) {
    for (let j = i + 1; j < base.length; j++) {
      combinations.push(`${base[i]} ${base[j]}`)
    }
  }

  return [...base, ...combinations].slice(0, 50) // Limit to 50 keywords
}

// Generate hreflang tags for international SEO
export function generateHreflangTags(canonicalUrl: string) {
  const languages = [
    { code: 'en', region: 'US', url: canonicalUrl },
    { code: 'en', region: 'GB', url: canonicalUrl },
    { code: 'es', region: 'ES', url: canonicalUrl.replace('/watch/', '/es/watch/') },
    { code: 'fr', region: 'FR', url: canonicalUrl.replace('/watch/', '/fr/watch/') },
    { code: 'de', region: 'DE', url: canonicalUrl.replace('/watch/', '/de/watch/') },
    { code: 'it', region: 'IT', url: canonicalUrl.replace('/watch/', '/it/watch/') },
    { code: 'pt', region: 'BR', url: canonicalUrl.replace('/watch/', '/pt/watch/') }
  ]

  return languages
}