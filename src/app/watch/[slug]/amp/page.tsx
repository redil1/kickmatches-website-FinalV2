import React from 'react'
import { db } from '@/db/client'
import { matches } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { format } from 'date-fns'
import { generateMatchSEO } from '@/utils/seo'
import { getBaseUrl } from '@/utils/url'
import { Metadata } from 'next'

type PageProps = { params: any }

export const revalidate = 3600

// Generate AMP-specific metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params
  const [match] = await db.select().from(matches).where(eq(matches.slug, resolvedParams.slug)).limit(1)
  
  if (!match) {
    return {
      title: 'Match Not Found | Kick AI of Matches AMP',
      description: 'The requested match could not be found.'
    }
  }

  const title = `${match.homeTeam} vs ${match.awayTeam} - ${match.league} | AMP`
  const description = `Watch ${match.homeTeam} vs ${match.awayTeam} live in the ${match.league}. Fast-loading AMP page for mobile users.`

  return {
    title,
    description,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/watch/${match.slug}`
    },
    other: {
      'amp': '',
      'viewport': 'width=device-width,minimum-scale=1,initial-scale=1'
    }
  }
}

export default async function AMPMatchPage({ params }: PageProps) {
  const resolvedParams = await params
  const [match] = await db.select().from(matches).where(eq(matches.slug, resolvedParams.slug)).limit(1)
  
  if (!match) {
    return (
      <html {...({amp: ''} as any)}>
        <head>
          <meta charSet="utf-8" />
          <script async src="https://cdn.ampproject.org/v0.js"></script>
          <title>Match Not Found | Kick AI of Matches AMP</title>
          <link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL}/watch/${resolvedParams.slug}`} />
          <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
          <style {...({'amp-boilerplate': ''} as any)}>{`body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`}</style>
          <noscript><style {...({'amp-boilerplate': ''} as any)}>{`body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`}</style></noscript>
        </head>
        <body>
          <div className="p-4 text-center">
            <h1>Match Not Found</h1>
            <p>The requested match could not be found.</p>
          </div>
        </body>
      </html>
    )
  }

  const kickoff = new Date(match.kickoffIso as unknown as string)
  const isLive = new Date() >= kickoff && new Date() <= new Date(kickoff.getTime() + 120 * 60 * 1000)
  const isUpcoming = new Date() < kickoff
  const baseUrl = getBaseUrl()
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SportsEvent',
    name: `${match.homeTeam} vs ${match.awayTeam}`,
    description: `Watch ${match.homeTeam} vs ${match.awayTeam} live in the ${match.league}`,
    startDate: match.kickoffIso as unknown as string,
    location: {
      '@type': 'Place',
      name: 'Stadium'
    },
    competitor: [
      {
        '@type': 'SportsTeam',
        name: match.homeTeam
      },
      {
        '@type': 'SportsTeam', 
        name: match.awayTeam
      }
    ],
    organizer: {
      '@type': 'Organization',
      name: match.league
    }
  }

  return (
    <html {...({amp: ''} as any)}>
      <head>
        <meta charSet="utf-8" />
        <script async src="https://cdn.ampproject.org/v0.js"></script>
        <script async {...({'custom-element': 'amp-iframe'} as any)} src="https://cdn.ampproject.org/v0/amp-iframe-0.1.js"></script>
        <script async {...({'custom-element': 'amp-social-share'} as any)} src="https://cdn.ampproject.org/v0/amp-social-share-0.1.js"></script>
        <title>{`${match.homeTeam} vs ${match.awayTeam} - ${match.league} | AMP`}</title>
        <link rel="canonical" href={`${baseUrl}/watch/${match.slug}`} />
        <meta name="viewport" content="width=device-width,minimum-scale=1,initial-scale=1" />
        <meta name="description" content={`Watch ${match.homeTeam} vs ${match.awayTeam} live in the ${match.league}. Fast-loading AMP page for mobile users.`} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        
        {/* AMP CSS */}
        <style {...({'amp-custom': ''} as any)}>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #000000 0%, #FFD700 50%, #000000 100%);
            color: white;
            min-height: 100vh;
          }
          .container {
            max-width: 768px;
            margin: 0 auto;
            padding: 16px;
          }
          .header {
            text-align: center;
            padding: 24px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          .match-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 8px 0;
          }
          .league {
            color: #fbbf24;
            font-size: 16px;
            margin: 0 0 16px 0;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
          }
          .live {
            background: #ef4444;
            animation: pulse 2s infinite;
          }
          .upcoming {
            background: #3b82f6;
          }
          .finished {
            background: #6b7280;
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .teams {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 32px 0;
            padding: 24px;
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
          }
          .team {
            text-align: center;
            flex: 1;
          }
          .team-name {
            font-size: 18px;
            font-weight: bold;
            margin: 8px 0;
          }
          .vs {
            font-size: 24px;
            font-weight: bold;
            margin: 0 16px;
          }
          .match-info {
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
            padding: 20px;
            margin: 24px 0;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 12px 0;
            padding: 8px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
          }
          .info-row:last-child {
            border-bottom: none;
          }
          .cta {
            background: linear-gradient(45deg, #7c3aed, #3b82f6);
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            text-align: center;
            margin: 24px 0;
            text-decoration: none;
            display: block;
            font-weight: bold;
          }
          .social-share {
            display: flex;
            justify-content: center;
            gap: 12px;
            margin: 24px 0;
          }
          .footer {
            text-align: center;
            padding: 24px 0;
            border-top: 1px solid rgba(255,255,255,0.1);
            color: #94a3b8;
            font-size: 14px;
          }
        `}</style>
        
        {/* AMP Boilerplate */}
        <style {...({'amp-boilerplate': ''} as any)}>{`body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}`}</style>
        <noscript><style {...({'amp-boilerplate': ''} as any)}>{`body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}`}</style></noscript>
      </head>
      
      <body>
        <div className="container">
          {/* Header */}
          <header className="header">
            <h1 className="match-title">{match.homeTeam} vs {match.awayTeam}</h1>
            <p className="league">{match.league}</p>
            <span className={`status-badge ${isLive ? 'live' : isUpcoming ? 'upcoming' : 'finished'}`}>
              {isLive ? '🔴 LIVE' : isUpcoming ? '⏰ UPCOMING' : '✅ FINISHED'}
            </span>
          </header>
          
          {/* Teams */}
          <div className="teams">
            <div className="team">
              <div className="team-name">{match.homeTeam}</div>
              <div>🏠 Home</div>
            </div>
            <div className="vs">VS</div>
            <div className="team">
              <div className="team-name">{match.awayTeam}</div>
              <div>✈️ Away</div>
            </div>
          </div>
          
          {/* Match Info */}
          <div className="match-info">
            <div className="info-row">
              <span>📅 Date</span>
              <span>{format(kickoff, 'PPP')}</span>
            </div>
            <div className="info-row">
              <span>⏰ Time</span>
              <span>{format(kickoff, 'p')}</span>
            </div>
            <div className="info-row">
              <span>🏆 Competition</span>
              <span>{match.league}</span>
            </div>
            <div className="info-row">
              <span>📺 Quality</span>
              <span>4K Ultra HD</span>
            </div>
          </div>
          
          {/* Video Player */}
          {match.scorebatEmbed && (
            React.createElement('amp-iframe', {
              width: '16',
              height: '9',
              layout: 'responsive',
              sandbox: 'allow-scripts allow-same-origin',
              src: match.scorebatEmbed as string
            })
          )}
          
          {/* CTA */}
          <a href={`${baseUrl}/trial`} className="cta">
            🆓 Start Free 12-Hour Trial - Watch in 4K
          </a>
          
          {/* Social Sharing */}
          <div className="social-share">
            {React.createElement('amp-social-share', {
              type: 'twitter',
              width: '40',
              height: '40',
              'data-param-text': `Watching ${match.homeTeam} vs ${match.awayTeam} live!`
            })}
            {React.createElement('amp-social-share', {
              type: 'facebook',
              width: '40',
              height: '40'
            })}
            {React.createElement('amp-social-share', {
              type: 'whatsapp',
              width: '40',
              height: '40',
              'data-param-text': `Check out ${match.homeTeam} vs ${match.awayTeam} live!`
            })}
          </div>
          
          {/* Footer */}
          <footer className="footer">
            <p>⚡ Powered by Kick AI of Matches</p>
            <p>Premium IPTV • 15,000+ Channels • 4K Quality</p>
            <a href={`${baseUrl}/watch/${match.slug}`} style={{color: '#7c3aed'}}>View Full Page</a>
          </footer>
        </div>
      </body>
    </html>
  )
}