import 'dotenv/config'
import { Worker } from 'bullmq'
import cron from 'node-cron'
import { db } from '@/db/client'
import { sql } from 'drizzle-orm'
import { enqueuePushBroadcast, queues } from '@/worker/queue'
import { getEmailBaseUrl, createEmailUrl } from '@/utils/url'

type JobPayload = Record<string, any>


async function pmmCreateHandler() {
  console.log('🔄 Starting PMM Create Handler - fetching fixtures for multiple dates...')
  
  // Fetch fixtures for the next 14 days starting from today
  const today = new Date()
  const allEvents: any[] = []
  
  for (let i = 0; i < 14; i++) {
    const currentDate = new Date(today)
    currentDate.setDate(today.getDate() + i)
    const dateStr = currentDate.toISOString().slice(0, 10)
    
    console.log(`📅 Fetching fixtures for: ${dateStr}`)
    
    try {
      // Use the new custom football API
      const resp = await fetch(`http://69.197.168.221:8004/football/events/scheduled?date=${dateStr}`, {
        headers: {
          'host': '69.197.168.221:8004',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
          'accept': 'application/json',
          'referer': 'http://69.197.168.221:8004/docs',
          'accept-encoding': 'gzip, deflate',
          'accept-language': 'en-US,en;q=0.9'
        }
      })
      
      const data = (await resp.json().catch(() => ({}))) as any
      const events = data.data?.events || []
      
      console.log(`✅ Found ${events.length} events for ${dateStr}`)
      allEvents.push(...events)
      
      // Small delay to avoid overwhelming the API
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      console.error(`❌ Error fetching fixtures for ${dateStr}:`, error)
    }
  }
  
  console.log(`📊 Total events collected: ${allEvents.length}`)
  
  // Top leagues mapping by tournament name
  // Updated to include exact tournament names from the API
  const topLeagues = new Set([
    // English leagues
    'Premier League',
    'Championship',
    'League One',
    'League Two',
    'FA Cup',
    'EFL Cup',
    'Community Shield',
    
    // Spanish leagues
    'La Liga',
    'Segunda División',
    'Copa del Rey',
    
    // Italian leagues
    'Serie A',
    'Serie B',
    'Coppa Italia',
    
    // German leagues
    'Bundesliga',
    '2. Bundesliga',
    'DFB Pokal',
    
    // French leagues
    'Ligue 1',
    'Ligue 2',
    'Coupe de France',
    
    // European competitions
    'Champions League',
    'Europa League',
    'Europa Conference League',
    
    // Dutch leagues
    'VriendenLoterij Eredivisie',
    'Keuken Kampioen Divisie',
    'KNVB Cup',
    
    // Portuguese leagues
    'Liga Portugal Betclic',
    'Liga Portugal 2',
    'Taça de Portugal',
    
    // Other major leagues
    'Scottish Premiership',
    'Belgian Pro League',
    'Turkish Süper Lig',
    'Russian Premier League',
    'Ukrainian Premier League'
  ])
  
  console.log(`🎯 Filtering for ${topLeagues.size} supported tournaments`)
  
  // Track tournament statistics
  const tournamentStats = new Map()
  const filteredTournaments = new Set()
  
  for (const event of allEvents) {
    const tournamentName = event.tournament?.name
    
    // Track all tournaments we see
    tournamentStats.set(tournamentName, (tournamentStats.get(tournamentName) || 0) + 1)
    
    if (!topLeagues.has(tournamentName)) {
      filteredTournaments.add(tournamentName)
      continue
    }
    
    // Only process upcoming/scheduled matches
    if (event.status?.type !== 'notstarted' && event.status?.code !== 0) continue
    
    const home = event.homeTeam?.name
    const away = event.awayTeam?.name
    const league = tournamentName
    
    // Convert timestamp to ISO string
    const kickoff_iso = new Date(event.startTimestamp * 1000).toISOString()
    
    const slug = `${home} vs ${away} ${kickoff_iso.substring(0, 10)}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const eventId = String(event.id || event.eventId || '')
    await db.execute(sql`
      insert into matches (slug, home_team, away_team, league, kickoff_iso, status, event_id)
      values (${slug}, ${home}, ${away}, ${league}, ${kickoff_iso}, 'scheduled', ${eventId})
      on conflict (slug) do update set
        home_team=excluded.home_team,
        away_team=excluded.away_team,
        league=excluded.league,
        kickoff_iso=excluded.kickoff_iso,
        event_id=excluded.event_id`)

    // Fetch highlights from Scorebat
    const score = await fetch('https://www.scorebat.com/video-api/v3/')
    const sjson = (await score.json().catch(() => ({}))) as any
    const embeds = sjson.response || []
    const found = embeds.find((e: any) => {
      const t = (e.title || '').toLowerCase()
      return t.includes(home.toLowerCase()) && t.includes(away.toLowerCase())
    })
    const embed = found?.embed || ''
    
    const checkout = process.env.CHECKOUT_URL || 'https://www.iptv.shopping/pricing'
    const trial_link = createEmailUrl('/api/trial/start')
    
    await db.execute(
      sql`update matches set scorebat_embed=${embed}, stripe_payment_link=${checkout}, trial_link=${trial_link} where slug=${slug}`
    )

    // Trigger ISR revalidation
    await fetch(createEmailUrl('/api/revalidate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret: process.env.REVALIDATE_SECRET, slug }),
    })
  }
  
  // Log tournament statistics
  console.log('\n📊 Tournament Statistics:')
  console.log('✅ Included tournaments:')
  Array.from(tournamentStats.entries())
    .filter(([name]) => topLeagues.has(name))
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => console.log(`  - ${name}: ${count} events`))
  
  console.log('\n❌ Filtered out tournaments:')
  Array.from(filteredTournaments)
    .sort()
    .forEach(name => console.log(`  - ${name}: ${tournamentStats.get(name)} events`))
  
  console.log('\n✅ PMM Create Handler completed - all fixtures processed!')
}

// Advanced Notification Template Engine with Psychological Triggers
interface NotificationTemplate {
  id: string
  name: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  psychologyTriggers: string[]
  template: string
  weight: number // For A/B testing distribution
}

interface NotificationData {
  homeTeam: string
  awayTeam: string
  minutesLeft: number
  matchSlug: string
  paymentLink: string
  matchLink: string
  viewerCount: number
  userSegment: 'new' | 'engaged' | 'returning' | 'vip'
  matchImportance: 'low' | 'medium' | 'high'
  isHalftime: boolean
  channel: 'telegram' | 'push' | 'email'
  kickoffTime: string
}

// High-Conversion Notification Templates with Professional Design
const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // 60-minute alerts - Premium positioning + Social proof
  {
    id: 'premium_60_a',
    name: 'Premium Alert - Urgency + Premium Positioning',
    urgencyLevel: 'medium',
    psychologyTriggers: ['urgency', 'premium_positioning', 'instant_access'],
    template: 'Kickoff in {minutesLeft} — {homeTeam} vs {awayTeam}. Watch legally. Buy:\n[Watch Match]({paymentLink})\n\n⚡ INSTANT 4K ACCESS - No Waiting\n🏆 Join 75,000+ Premium Members\n💎 Professional Commentary + Multi-Angle Views\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 IPTV SMARTERS PRO\nIPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K\n\n[Get IPTV SMARTERS PRO]({paymentLink})',
    weight: 30
  },
  {
    id: 'social_proof_60_b',
    name: 'Social Proof + Scarcity',
    urgencyLevel: 'medium',
    psychologyTriggers: ['social_proof', 'scarcity', 'fomo'],
    template: 'Kickoff in {minutesLeft} — {homeTeam} vs {awayTeam}. Watch legally. Buy:\n[Watch Match]({paymentLink})\n\n📊 {viewerCount} fans already watching live\n⏰ Only {minutesLeft} minutes to secure your spot\n🎯 Limited 4K streams available\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 IPTV SMARTERS PRO\nIPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K\n\n[Get IPTV SMARTERS PRO]({paymentLink})',
    weight: 25
  },
  // 30-minute alerts - Increased urgency
  {
    id: 'urgency_30_a',
    name: 'Escalated Urgency + FOMO',
    urgencyLevel: 'high',
    psychologyTriggers: ['urgency', 'fomo', 'scarcity'],
    template: 'Kickoff in {minutesLeft} — {homeTeam} vs {awayTeam}. Watch legally. Buy:\n[Watch Match]({paymentLink})\n\n🔥 {viewerCount}+ fans streaming now\n⏰ Limited spots remaining\n💎 4K Quality guaranteed\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 IPTV SMARTERS PRO\nIPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K\n\n[Get IPTV SMARTERS PRO]({paymentLink})',
    weight: 35
  },
  // 5-minute alerts - Maximum urgency + FOMO
  {
    id: 'final_call_5_a',
    name: 'Maximum Urgency + FOMO',
    urgencyLevel: 'critical',
    psychologyTriggers: ['maximum_urgency', 'fomo', 'instant_access'],
    template: 'Kickoff in {minutesLeft} — {homeTeam} vs {awayTeam}. Watch legally. Buy:\n[Watch Match]({paymentLink})\n\n⚡ LAST {minutesLeft} MINUTES - Don\'t Miss Kickoff!\n🔥 {viewerCount} fans already streaming\n💎 4K Quality + Instant Access\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 IPTV SMARTERS PRO\nIPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K\n\n[Get IPTV SMARTERS PRO]({paymentLink})',
    weight: 40
  },
  {
    id: 'exclusive_5_b',
    name: 'Exclusive Access',
    urgencyLevel: 'critical',
    psychologyTriggers: ['exclusivity', 'premium_positioning', 'urgency'],
    template: 'Kickoff in {minutesLeft} — {homeTeam} vs {awayTeam}. Watch legally. Buy:\n[Watch Match]({paymentLink})\n\nVIP ACCESS AVAILABLE:\n🏆 Professional Commentary\n📱 Multi-Device Streaming\n🎯 Zero Buffering Guarantee\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 IPTV SMARTERS PRO\nIPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K\n\n[Get IPTV SMARTERS PRO]({paymentLink})',
    weight: 30
  },
  // Halftime alerts - Engagement retention
  {
    id: 'halftime_engagement',
    name: 'Halftime Engagement + Urgency',
    urgencyLevel: 'high',
    psychologyTriggers: ['engagement', 'urgency', 'continuation'],
    template: 'Halftime — {homeTeam} vs {awayTeam}. Watch legally. Buy:\n[Watch Match]({paymentLink})\n\n🔥 Second half starting soon!\n📊 Don\'t miss the comeback\n⚡ Instant access - No interruption\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n🔥 IPTV SMARTERS PRO\nIPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K\n\n[Get IPTV SMARTERS PRO]({paymentLink})',
    weight: 100
  }
]

// Dynamic viewer count generation with realistic patterns
function generateViewerCount(minutesLeft: number, matchImportance: string): number {
  const baseCount = matchImportance === 'high' ? 15000 : matchImportance === 'medium' ? 8000 : 3000
  const urgencyMultiplier = minutesLeft <= 5 ? 1.8 : minutesLeft <= 30 ? 1.4 : 1.0
  const randomVariation = 0.8 + Math.random() * 0.4 // ±20% variation
  return Math.floor(baseCount * urgencyMultiplier * randomVariation)
}

// Enhanced User Personalization System
interface UserProfile {
  id: string
  segment: 'new' | 'engaged' | 'returning' | 'vip'
  preferredTeams: string[]
  preferredLeagues: string[]
  engagementScore: number
  lastActiveDate: Date
  conversionHistory: boolean
  notificationPreference: 'minimal' | 'standard' | 'aggressive'
  timeZone: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
}

// Advanced user segmentation with behavioral analysis
async function determineUserSegment(userId?: string): Promise<'new' | 'engaged' | 'returning' | 'vip'> {
  if (!userId) {
    // Fallback for anonymous users
    const rand = Math.random()
    if (rand < 0.4) return 'new'
    if (rand < 0.8) return 'engaged'
    return 'returning'
  }
  
  try {
    // Get user engagement data from database
    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN clicked = true THEN 1 END) as clicked_notifications,
        MAX(created_at) as last_activity,
        COUNT(CASE WHEN converted = true THEN 1 END) as conversions
      FROM user_notification_history 
      WHERE user_id = ${userId} 
      AND created_at > NOW() - INTERVAL '30 days'
    `)
    
    const stats = (userStats as any).rows?.[0]
    if (!stats || stats.total_notifications === 0) return 'new'
    
    const clickRate = stats.clicked_notifications / stats.total_notifications
    const daysSinceLastActivity = Math.floor((Date.now() - new Date(stats.last_activity).getTime()) / (1000 * 60 * 60 * 24))
    
    // VIP users: high engagement + conversions
    if (stats.conversions > 0 && clickRate > 0.6) return 'vip'
    
    // Engaged users: good click rate, recent activity
    if (clickRate > 0.3 && daysSinceLastActivity < 7) return 'engaged'
    
    // Returning users: some activity but lower engagement
    if (daysSinceLastActivity < 14) return 'returning'
    
    return 'new'
  } catch (error) {
    console.error('Error determining user segment:', error)
    return 'engaged' // Safe fallback
  }
}

// Dynamic content personalization based on user preferences
function personalizeContent(template: string, userProfile: UserProfile, matchData: NotificationData): string {
  let personalizedTemplate = template
  
  // Team-specific personalization
  if (userProfile.preferredTeams.includes(matchData.homeTeam) || userProfile.preferredTeams.includes(matchData.awayTeam)) {
    personalizedTemplate = personalizedTemplate.replace('🔥', '⭐ YOUR TEAM:')
    personalizedTemplate = personalizedTemplate.replace('PREMIUM ALERT:', 'YOUR TEAM ALERT:')
  }
  
  // Engagement-based messaging
  switch (userProfile.segment) {
    case 'vip':
      personalizedTemplate = personalizedTemplate.replace('Join 75,000+', 'Welcome back, VIP Member!')
      personalizedTemplate = personalizedTemplate.replace('Limited', 'VIP Priority')
      break
    case 'new':
      personalizedTemplate = personalizedTemplate.replace('fans already streaming', 'new fans discovering premium quality')
      personalizedTemplate = personalizedTemplate.replace('💎 4K Quality', '💎 Try 4K Quality FREE')
      break
    case 'returning':
      personalizedTemplate = personalizedTemplate.replace('INSTANT ACCESS', 'WELCOME BACK - INSTANT ACCESS')
      break
  }
  
  // Notification preference adaptation
  if (userProfile.notificationPreference === 'minimal') {
    // Remove excessive emojis and shorten text
    personalizedTemplate = personalizedTemplate.replace(/🔥|⚡|🚨|💎/g, '')
    personalizedTemplate = personalizedTemplate.split('\n\n')[0] + '\n\n👆 WATCH NOW'
  } else if (userProfile.notificationPreference === 'aggressive') {
    // Add more urgency indicators
    personalizedTemplate = personalizedTemplate.replace('STARTING NOW!', 'STARTING NOW! ⏰ DON\'T MISS OUT!')
    personalizedTemplate = personalizedTemplate.replace('LIMITED', '🚨 EXTREMELY LIMITED')
  }
  
  return personalizedTemplate
}

// Smart template selection based on user behavior
function selectPersonalizedTemplate(minutesLeft: number, isHalftime: boolean, userProfile: UserProfile): NotificationTemplate {
  let candidates = NOTIFICATION_TEMPLATES.filter(template => {
    if (isHalftime) return template.id.includes('halftime')
    if (minutesLeft <= 5) return template.id.includes('_5_')
    if (minutesLeft <= 30) return template.id.includes('_30_')
    return template.id.includes('_60_')
  })
  
  // Adjust template weights based on user segment
  candidates = candidates.map(template => {
    let adjustedWeight = template.weight
    
    switch (userProfile.segment) {
      case 'vip':
        // VIP users prefer exclusive/premium messaging
        if (template.psychologyTriggers.includes('exclusivity') || template.psychologyTriggers.includes('premium_positioning')) {
          adjustedWeight *= 2
        }
        break
      case 'new':
        // New users respond better to social proof
        if (template.psychologyTriggers.includes('social_proof')) {
          adjustedWeight *= 1.5
        }
        break
      case 'engaged':
        // Engaged users like urgency and FOMO
        if (template.psychologyTriggers.includes('urgency') || template.psychologyTriggers.includes('fomo')) {
          adjustedWeight *= 1.3
        }
        break
    }
    
    return { ...template, weight: adjustedWeight }
  })
  
  // Weighted selection
  const totalWeight = candidates.reduce((sum, t) => sum + t.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const template of candidates) {
    random -= template.weight
    if (random <= 0) {
      return template
    }
  }
  
  return candidates[0]
}

// Match importance scoring
function getMatchImportance(league: string, homeTeam: string, awayTeam: string): 'low' | 'medium' | 'high' {
  const premiumLeagues = ['Premier League', 'Champions League', 'La Liga', 'Serie A', 'Bundesliga']
  const bigClubs = ['Manchester United', 'Liverpool', 'Arsenal', 'Chelsea', 'Manchester City', 'Real Madrid', 'Barcelona', 'Bayern Munich', 'Juventus', 'AC Milan']
  
  if (premiumLeagues.includes(league)) {
    if (bigClubs.includes(homeTeam) || bigClubs.includes(awayTeam)) {
      return 'high'
    }
    return 'medium'
  }
  return 'low'
}

// A/B Testing template selection
function selectNotificationTemplate(minutesLeft: number, isHalftime: boolean): NotificationTemplate {
  let candidates: NotificationTemplate[]
  
  if (isHalftime) {
    candidates = NOTIFICATION_TEMPLATES.filter(t => t.id.includes('halftime'))
  } else if (minutesLeft <= 5) {
    candidates = NOTIFICATION_TEMPLATES.filter(t => t.id.includes('_5_'))
  } else if (minutesLeft <= 30) {
    candidates = NOTIFICATION_TEMPLATES.filter(t => t.id.includes('_30_'))
  } else {
    candidates = NOTIFICATION_TEMPLATES.filter(t => t.id.includes('_60_'))
  }
  
  // Weighted random selection for A/B testing
  const totalWeight = candidates.reduce((sum, t) => sum + t.weight, 0)
  let random = Math.random() * totalWeight
  
  for (const template of candidates) {
    random -= template.weight
    if (random <= 0) {
      return template
    }
  }
  
  return candidates[0] // Fallback
}

// Enhanced UTM parameter generation with advanced tracking
function generateAdvancedUTM(template: NotificationTemplate, data: NotificationData, userId?: string): string {
  const timestamp = Date.now()
  const sessionId = `${timestamp}_${Math.random().toString(36).substr(2, 9)}`
  
  const params = new URLSearchParams({
    // Standard UTM parameters
    utm_source: 'notification',
    utm_medium: data.channel || 'push',
    utm_campaign: `match_alert_${data.minutesLeft}min`,
    utm_content: template.id,
    utm_term: template.psychologyTriggers.join('_'),
    
    // Advanced conversion tracking
    template_id: template.id,
    template_name: template.name.toLowerCase().replace(/\s+/g, '_'),
    psychology: template.psychologyTriggers.join(','),
    urgency: template.urgencyLevel,
    
    // User and behavioral data
    viewer_count: data.viewerCount.toString(),
    user_segment: data.userSegment,
    match_importance: data.matchImportance,
    
    // Session and attribution tracking
    session_id: sessionId,
    timestamp: timestamp.toString(),
    notification_type: data.minutesLeft === 0 ? 'halftime' : 'pre_match',
    
    // A/B testing and optimization
    variant: template.id.split('_')[1] || 'default',
    test_group: data.userSegment,
    
    // Match-specific tracking
    match_teams: `${data.homeTeam}_vs_${data.awayTeam}`.toLowerCase().replace(/\s+/g, '_'),
    kickoff_time: data.kickoffTime,
    
    // Device and timing context
    alert_timing: data.minutesLeft.toString(),
    day_of_week: new Date().getDay().toString(),
    hour_of_day: new Date().getHours().toString()
  })
  
  // Add user ID if available (for logged-in users)
  if (userId) {
    params.set('user_id', userId)
  }
  
  return params.toString()
}

// Template rendering engine with full IPTV SMARTERS PRO branding support
function renderNotificationTemplate(template: NotificationTemplate, data: NotificationData): string {
  return template.template
    .replace(/{homeTeam}/g, data.homeTeam)
    .replace(/{awayTeam}/g, data.awayTeam)
    .replace(/{minutesLeft}/g, Math.max(data.minutesLeft, 0).toString())
    .replace(/{viewerCount}/g, data.viewerCount.toLocaleString())
    .replace(/{matchLink}/g, data.matchLink) // Use match page link for professional templates
    .replace(/{paymentLink}/g, data.paymentLink)
    .replace(/{matchSlug}/g, data.matchSlug)
    .replace(/{userSegment}/g, data.userSegment)
    .replace(/{matchImportance}/g, data.matchImportance)
    .replace(/{kickoffTime}/g, data.kickoffTime)
    // IPTV SMARTERS PRO branding variables
    .replace(/{brandName}/g, 'IPTV SMARTERS PRO')
    .replace(/{brandTagline}/g, 'IPTV SMARTERS PRO | N°1 en France')
    .replace(/{brandDescription}/g, 'Le Meilleur Service IPTV Premium avec +15000 chaînes HD/4K')
    .replace(/{brandUrl}/g, 'https://www.iptv.shopping/pricing')
    // Quality and feature highlights
    .replace(/{qualityBadge}/g, '💎 4K Quality')
    .replace(/{channelCount}/g, '+15000 chaînes HD/4K')
    .replace(/{instantAccess}/g, '⚡ Instant Access')
    .replace(/{zeroBuff}/g, '🎯 Zero Buffering Guarantee')
}

async function pmmAlertHandler() {
  const res = await db.execute(sql`select * from matches where kickoff_iso::date = current_date;`)
  const rows = (res as any).rows || []
  const now = new Date()
  
  for (const m of rows) {
    const mins = Math.round((new Date(m.kickoff_iso).getTime() - now.getTime()) / 60000)
    const should = [60, 30, 5].includes(mins) || m.status === 'halftime'
    if (!should) continue
    
    // Prepare notification data
     const matchImportance = getMatchImportance(m.league, m.home_team, m.away_team)
     const viewerCount = generateViewerCount(mins, matchImportance)
     
     // Get all users for personalized notifications
     const allUsers = await db.execute(sql`
       SELECT 
         id,
         telegram_user_id,
         preferred_teams,
         preferred_leagues,
         notification_preference,
         timezone,
         device_type
       FROM users 
       WHERE (telegram_user_id IS NOT NULL OR push_subscription IS NOT NULL)
     `)
     
     const users = (allUsers as any).rows || []
     
     // Process notifications for each user with personalization
     for (const user of users) {
       try {
         // Determine user segment with behavioral analysis
         const userSegment = await determineUserSegment(user.id)
         
         // Create user profile
         const userProfile: UserProfile = {
           id: user.id,
           segment: userSegment,
           preferredTeams: user.preferred_teams ? JSON.parse(user.preferred_teams) : [],
           preferredLeagues: user.preferred_leagues ? JSON.parse(user.preferred_leagues) : [],
           engagementScore: 0, // Can be calculated from user_notification_history
           lastActiveDate: new Date(),
           conversionHistory: false, // Can be determined from purchase history
           notificationPreference: user.notification_preference || 'standard',
           timeZone: user.timezone || 'UTC',
           deviceType: user.device_type || 'mobile'
         }
         
         const notificationData: NotificationData = {
           homeTeam: m.home_team,
           awayTeam: m.away_team,
           minutesLeft: mins,
           matchSlug: m.slug,
           paymentLink: m.stripe_payment_link,
           matchLink: createEmailUrl(`/match/${m.slug}`),
           viewerCount,
           userSegment,
           matchImportance,
           isHalftime: m.status === 'halftime',
           channel: 'telegram',
           kickoffTime: m.kickoff_iso
         }
         
         // Select personalized template
         const selectedTemplate = selectPersonalizedTemplate(mins, m.status === 'halftime', userProfile)
         
         // Render base template
         let text = renderNotificationTemplate(selectedTemplate, notificationData)
         
         // Apply personalization
         text = personalizeContent(text, userProfile, notificationData)
         
         // Generate advanced UTM parameters with user-specific data
         const enhancedMatchData = {
           ...notificationData,
           userSegment: userProfile.segment
         }
         const utmParams = generateAdvancedUTM(selectedTemplate, enhancedMatchData, user.id)
         const finalUrl = `${m.stripe_payment_link}?${utmParams}`
         
         // Send personalized Telegram notification
         if (user.telegram_user_id && process.env.TELEGRAM_BOT_TOKEN) {
           await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               chat_id: user.telegram_user_id,
               text,
               parse_mode: 'Markdown'
             })
           })
         }
         
         // Enhanced push notification with dynamic title
         const pushTitle = selectedTemplate.urgencyLevel === 'critical' 
           ? `🚨 ${m.home_team} vs ${m.away_team} - STARTING NOW!`
           : selectedTemplate.urgencyLevel === 'high'
           ? `⚡ ${m.home_team} vs ${m.away_team} - ${mins} MIN WARNING`
           : `🔥 ${m.home_team} vs ${m.away_team}`
         
         // Log personalization details
         console.log(`👤 User ${user.id} (${userProfile.segment}): ${selectedTemplate.name}`);
         console.log(`🎯 Personalization: ${userProfile.preferredTeams.length} teams, ${userProfile.notificationPreference} preference`);
         
         // Track notification for analytics
         await db.execute(sql`
           INSERT INTO user_notification_history (
             user_id, match_id, template_id, psychology_triggers, 
             urgency_level, viewer_count, user_segment, sent_at
           ) VALUES (
             ${user.id}, ${m.slug}, ${selectedTemplate.id}, 
             ${JSON.stringify(selectedTemplate.psychologyTriggers)},
             ${selectedTemplate.urgencyLevel}, ${viewerCount}, 
             ${userProfile.segment}, NOW()
           )
         `)
         
       } catch (error) {
         console.error(`Error processing notification for user ${user.id}:`, error)
       }
     }
     
     // Fallback: Send professional notification if no users found
     if (users.length === 0) {
       const defaultUserSegment = await determineUserSegment()
       
       // Create default user profile for professional template selection
       const defaultUserProfile: UserProfile = {
         id: 'fallback-user',
         segment: defaultUserSegment,
         preferredTeams: [],
         preferredLeagues: [],
         engagementScore: 0,
         lastActiveDate: new Date(),
         conversionHistory: false,
         notificationPreference: 'standard',
         timeZone: 'UTC',
         deviceType: 'mobile'
       }
       
       // Use professional template selection instead of basic template
       const defaultTemplate = selectPersonalizedTemplate(mins, m.status === 'halftime', defaultUserProfile)
       
       const defaultData: NotificationData = {
           homeTeam: m.home_team,
           awayTeam: m.away_team,
           minutesLeft: mins,
           matchSlug: m.slug,
           paymentLink: m.stripe_payment_link,
           matchLink: createEmailUrl(`/match/${m.slug}`),
         viewerCount,
         userSegment: defaultUserSegment,
         matchImportance,
         isHalftime: m.status === 'halftime',
         channel: 'telegram',
         kickoffTime: m.kickoff_iso
       }
       
       // Render professional template and apply personalization
       let text = renderNotificationTemplate(defaultTemplate, defaultData)
       text = personalizeContent(text, defaultUserProfile, defaultData)
       
       const utmParams = generateAdvancedUTM(defaultTemplate, defaultData)
       const finalUrl = `${m.stripe_payment_link}?${utmParams}`
       
       console.log(`🎯 Fallback template: ${defaultTemplate.name} (${defaultTemplate.id})`);
       console.log(`📊 Psychology triggers: ${defaultTemplate.psychologyTriggers.join(', ')}`);
       console.log(`👥 Viewer count: ${viewerCount.toLocaleString()}`);
       console.log(`🎪 User segment: ${defaultUserSegment}`);
       console.log(`⭐ Match importance: ${matchImportance}`);
       
       // Send to admin chat as fallback
       if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
         try {
           await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               chat_id: process.env.TELEGRAM_CHAT_ID,
               text,
               parse_mode: 'Markdown'
             })
           })
         } catch (error) {
           console.error('Failed to send fallback Telegram message:', error)
         }
       }
       
       // Enhanced push notification with dynamic title
       const pushTitle = defaultTemplate.urgencyLevel === 'critical' 
         ? `🚨 ${m.home_team} vs ${m.away_team} - STARTING NOW!`
         : defaultTemplate.urgencyLevel === 'high'
         ? `⚡ ${m.home_team} vs ${m.away_team} - ${mins} MIN WARNING`
         : `🔥 ${m.home_team} vs ${m.away_team}`
       
       // Enqueue fallback push notifications
       await enqueuePushBroadcast({
         title: pushTitle,
         body: text,
         url: finalUrl,
       })
     }
     
     console.log(`✅ Processed ${users.length} personalized notifications for ${m.home_team} vs ${m.away_team}`);
     console.log(`📊 Match importance: ${matchImportance}, Viewer count: ${viewerCount.toLocaleString()}`)
  }
}

// type TrialJob = { phone: string; username: string; password: string }

new Worker<JobPayload>('trial-provision', async (job) => {
  if (job.name === 'nudge') {
    const checkout = process.env.CHECKOUT_URL || 'https://www.iptv.shopping/pricing'
    await enqueuePushBroadcast({
      title: 'Trial running',
      body: '👍 Working? Get full access now.',
      url: `${checkout}?utm_source=pmm&utm_medium=push&utm_campaign=trial_nudge`,
    })
  }
  if (job.name === 'expire') {
    // mark trials as expired for given phone
    const { phone } = job.data as any
    await db.execute(sql`update trial_sessions set status='expired' where phone=${phone} and status='active'`)
  }
}, { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })

// Webhook-equivalent function to be called from /api/trial/start route after OTP verification & cooldown
export async function scheduleTrialFlow(phone: string) {
  await queues.trial.add('nudge', { phone }, { removeOnComplete: true, removeOnFail: true, delay: 30 * 60 * 1000 })
  await queues.trial.add('expire', { phone }, { removeOnComplete: true, removeOnFail: true, delay: 12 * 60 * 60 * 1000 })
}

// CRON schedules
cron.schedule('0 4 * * *', () => queues.create.add('tick', {}, { removeOnComplete: true }))
cron.schedule('*/5 * * * *', () => queues.alert.add('tick', {}, { removeOnComplete: true }))

new Worker('pmm-create', async () => pmmCreateHandler(), { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })
new Worker('pmm-alert', async () => pmmAlertHandler(), { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })
new Worker('push-broadcast', async (job) => {
  const { title, body, url } = job.data as any
  await fetch(createEmailUrl('/api/push/send'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.PUSH_API_SECRET, title, body, url }),
  })
}, { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })

console.log('Worker started: PMM.Create (04:00), PMM.Alert (*/5), Trial jobs (nudge/expire)')


