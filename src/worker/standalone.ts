import 'dotenv/config'
import { Worker } from 'bullmq'
import cron from 'node-cron'
import { db } from '../db/client'
import { sql } from 'drizzle-orm'
import { enqueuePushBroadcast, queues } from './queue'
import { EmailNotificationService, type UserEmailProfile } from '../services/emailService'
import { getEmailBaseUrl, createEmailUrl } from '../utils/url'
import { runSnapshotAndRevalidate } from '../scripts/snapshotApi'
import { telegramService } from '../services/telegram'
import { sofascoreService } from '../services/sofascore'

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
      const resp = await fetch(`http://155.117.46.251:8004/football/events/scheduled?date=${dateStr}`, {
        headers: {
          'host': '155.117.46.251:8004',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
          'accept': 'application/json',
          'referer': 'http://155.117.46.251:8004/docs',
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

  // Track tournament statistics
  const tournamentStats = new Map()

  for (const event of allEvents) {
    const tournamentName = event.tournament?.name

    // Track all tournaments we see
    tournamentStats.set(tournamentName, (tournamentStats.get(tournamentName) || 0) + 1)

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

    await db.execute(sql`
      insert into matches (slug, home_team, away_team, league, kickoff_iso, status)
      values (${slug}, ${home}, ${away}, ${league}, ${kickoff_iso}, 'scheduled')
      on conflict (slug) do update set
        home_team=excluded.home_team,
        away_team=excluded.away_team,
        league=excluded.league,
        kickoff_iso=excluded.kickoff_iso`)

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
  console.log(`✅ Processed ${tournamentStats.size} tournaments:`)
  Array.from(tournamentStats.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => console.log(`  - ${name}: ${count} events`))

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

// Professional IPTV SMARTERS PRO Notification Templates with Advanced Psychology
const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  // 60-minute alerts - Premium positioning + Social proof
  {
    id: 'pro_60min_premium',
    name: 'Professional 60min - Premium Experience',
    urgencyLevel: 'medium',
    psychologyTriggers: ['urgency', 'exclusivity', 'social_proof'],
    template: '⚽ {homeTeam} vs {awayTeam} - Starting in 1 Hour!\n\n🔥 Don\'t miss this epic clash! Get ready for {homeTeam} vs {awayTeam} with IPTV SMARTERS PRO - your premium sports streaming experience.\n\n📺 Watch in stunning HD quality\n🎯 Multiple camera angles\n📊 Live stats & commentary\n\n🚀 Stream with IPTV SMARTERS PRO\n{paymentLink}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 IPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K',
    weight: 30
  },
  {
    id: 'pro_60min_social',
    name: 'Professional 60min - Social Proof',
    urgencyLevel: 'medium',
    psychologyTriggers: ['social_proof', 'scarcity', 'fomo'],
    template: '⚽ {homeTeam} vs {awayTeam} - Starting in 1 Hour!\n\n📊 {viewerCount} fans already getting ready for this match\n⏰ Join thousands of premium viewers\n🎯 Experience like never before\n\n🌟 IPTV SMARTERS PRO delivers:\n• Crystal clear 4K streaming\n• Zero buffering guarantee\n• Professional commentary\n\n🚀 Upgrade to Premium Now\n{paymentLink}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 IPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K',
    weight: 25
  },
  // 30-minute alerts - Increased urgency
  {
    id: 'pro_30min_urgency',
    name: 'Professional 30min - Final Call',
    urgencyLevel: 'high',
    psychologyTriggers: ['urgency', 'fomo', 'authority'],
    template: '🚨 {homeTeam} vs {awayTeam} - 30 Minutes to Kickoff!\n\n⏰ Final call! {homeTeam} vs {awayTeam} starts in just 30 minutes.\n\n🏆 Experience the match like never before with IPTV SMARTERS PRO:\n• Crystal clear 4K streaming\n• Zero buffering guarantee\n• Exclusive pre-match analysis\n\n⚡ Get Instant Access\n{paymentLink}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 IPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K',
    weight: 35
  },
  // 5-minute alerts - Maximum urgency + FOMO
  {
    id: 'pro_5min_live',
    name: 'Professional 5min - Live Now',
    urgencyLevel: 'critical',
    psychologyTriggers: ['urgency', 'fomo', 'instant_gratification'],
    template: '🔴 LIVE NOW: {homeTeam} vs {awayTeam}\n\n🎬 The match is starting RIGHT NOW! Don\'t miss a single moment of {homeTeam} vs {awayTeam}.\n\n🌟 IPTV SMARTERS PRO delivers:\n• Instant HD streaming\n• Multi-device access\n• Professional commentary\n• Real-time highlights\n\n🎯 Watch Live Now\n{paymentLink}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 IPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K',
    weight: 40
  },
  {
    id: 'pro_5min_exclusive',
    name: 'Professional 5min - Exclusive Access',
    urgencyLevel: 'critical',
    psychologyTriggers: ['exclusivity', 'premium_positioning', 'urgency'],
    template: '🔴 LIVE: {homeTeam} vs {awayTeam} - 5 Minutes!\n\n⚡ LAST 5 MINUTES - Secure your premium access now!\n\nVIP FEATURES AVAILABLE:\n🏆 Professional Commentary\n📱 Multi-Device Streaming\n🎯 Zero Buffering Guarantee\n💎 4K Quality + Instant Access\n\n🚀 Get Premium Access\n{paymentLink}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 IPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K',
    weight: 30
  },
  // Halftime alerts - Engagement retention
  {
    id: 'pro_halftime_analysis',
    name: 'Professional Halftime - Expert Analysis',
    urgencyLevel: 'high',
    psychologyTriggers: ['analysis', 'expertise', 'anticipation'],
    template: '⏸️ {homeTeam} vs {awayTeam} - Halftime Analysis\n\n📊 Halftime break! Catch up on the action and get ready for an explosive second half.\n\n🎯 IPTV SMARTERS PRO halftime features:\n• Expert analysis & insights\n• Player performance stats\n• Tactical breakdowns\n• Second half predictions\n\n📈 Get Premium Insights\n{paymentLink}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔥 IPTV SMARTERS PRO | N°1 en France\nLe Meilleur Service IPTV Premium avec +15000 chaînes HD/4K',
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
    if (minutesLeft <= 5) return template.id.includes('5min')
    if (minutesLeft <= 30) return template.id.includes('30min')
    return template.id.includes('60min')
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

    // Get all users for personalized notifications (including email users)
    const allUsers = await db.execute(sql`
       SELECT 
         id,
         telegram_id as telegram_user_id,
         email,
         email_notifications_enabled,
         email_verified,
         phone,
         '[]' as preferred_teams,
         '[]' as preferred_leagues,
         'standard' as notification_preference,
         'UTC' as timezone,
         'mobile' as device_type
       FROM app_users 
       WHERE telegram_id IS NOT NULL OR (email IS NOT NULL AND email_notifications_enabled = true)
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
          matchLink: 'https://www.iptv.shopping/pricing',
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

        // Send personalized Email notification
        if (user.email && user.email_notifications_enabled) {
          try {
            const emailService = new EmailNotificationService()

            // Determine email template based on timing
            let templateId: string
            if (m.status === 'halftime') {
              templateId = 'match_halftime'
            } else if (mins <= 5) {
              templateId = 'match_alert_5min'
            } else if (mins <= 30) {
              templateId = 'match_alert_30min'
            } else {
              templateId = 'match_alert_60min'
            }

            // Prepare email data with enhanced match information
            const emailData = {
              homeTeam: m.home_team,
              awayTeam: m.away_team,
              league: m.league,
              kickoffTime: new Date(m.kickoff_iso).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              }),
              minutesLeft: mins,
              matchSlug: m.slug,
              paymentLink: finalUrl,
              matchLink: 'https://www.iptv.shopping/pricing',
              viewerCount: viewerCount,
              userSegment: userProfile.segment,
              matchImportance,
              utmParams: utmParams,
              urgencyLevel: selectedTemplate.urgencyLevel,
              psychologyTriggers: selectedTemplate.psychologyTriggers,
              userName: user.phone || 'Valued Customer',
              isHalftime: m.status === 'halftime'
            }

            // Create user email profile object
            const userEmailProfile: UserEmailProfile = {
              id: user.id,
              email: user.email,
              name: user.phone || 'Sports Fan',
              unsubscribeToken: user.unsubscribe_token || '',
              emailNotificationsEnabled: user.email_notifications_enabled ?? true
            }

            // Send email notification with correct parameter order
            const emailResult = await emailService.sendMatchAlert(
              userEmailProfile,
              emailData,
              templateId
            )

            if (emailResult) {
              console.log(`📧 Email sent successfully to ${user.email} for ${m.home_team} vs ${m.away_team}`)
            } else {
              console.log(`📧 Email not sent to ${user.email} (notifications disabled or invalid email)`)
            }

          } catch (emailError) {
            console.error(`💥 Email service error for user ${user.id}:`, emailError)
          }
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
             user_id, match_id, template_id, psychological_trigger, 
             urgency_level, viewer_count, user_segment, created_at
           ) VALUES (
             ${user.id}, ${m.id}, ${selectedTemplate.id}, 
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
        matchLink: 'https://www.iptv.shopping/pricing',
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

// Handler for Live Match Events (Real-Time Data)
async function pmmLiveHandler() {
  const now = new Date()
  // Find matches that are currently live (kickoff < now < kickoff + 2h)
  const res = await db.execute(sql`
    select * from matches 
    where kickoff_iso < ${now.toISOString()} 
    and kickoff_iso > ${new Date(now.getTime() - 120 * 60000).toISOString()}
  `)
  const liveMatches = (res as any).rows || []

  if (liveMatches.length === 0) return

  for (const m of liveMatches) {
    // Fetch real live score from Sofascore
    const liveData = await sofascoreService.fetchLiveScore(m.event_id)

    if (!liveData) continue

    // Check if score changed
    const currentHomeScore = m.home_score || 0
    const currentAwayScore = m.away_score || 0

    if (liveData.homeScore !== currentHomeScore || liveData.awayScore !== currentAwayScore) {
      console.log(`⚽️ GOAL DETECTED: ${m.home_team} ${liveData.homeScore}-${liveData.awayScore} ${m.away_team}`)

      // Update DB
      await db.execute(sql`
        update matches 
        set home_score=${liveData.homeScore}, away_score=${liveData.awayScore}, status=${liveData.status}
        where slug=${m.slug}
      `)

      // Determine scoring team
      let scoringTeam = 'Unknown'
      if (liveData.homeScore > currentHomeScore) scoringTeam = m.home_team
      if (liveData.awayScore > currentAwayScore) scoringTeam = m.away_team

      const matchLink = createEmailUrl(`/watch/${m.slug}`)

      // Broadcast to Admin Channel
      if (process.env.TELEGRAM_CHAT_ID) {
        await telegramService.broadcastGoalAlert(
          m.slug,
          m.home_team,
          m.away_team,
          scoringTeam,
          liveData.minute,
          matchLink,
          [process.env.TELEGRAM_CHAT_ID]
        )
      }

      // Broadcast to Subscribers
      const allUsers = await db.execute(sql`SELECT telegram_id FROM app_users WHERE telegram_id IS NOT NULL`)
      const users = (allUsers as any).rows || []
      const userIds = users.map((u: any) => u.telegram_id)

      if (userIds.length > 0) {
        await telegramService.broadcastGoalAlert(
          m.slug,
          m.home_team,
          m.away_team,
          scoringTeam,
          liveData.minute,
          matchLink,
          userIds
        )
      }
    }
  }
}

// Workers
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
    const { phone } = job.data as any
    await db.execute(sql`update trial_sessions set status='expired' where phone=${phone} and status='active'`)
  }
}, { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })

// CRON schedules
cron.schedule('0 4 * * *', () => queues.create.add('tick', {}, { removeOnComplete: true }))
cron.schedule('0 * * * *', () => queues.create.add('tick', {}, { removeOnComplete: true }))
cron.schedule('*/5 * * * *', () => queues.alert.add('tick', {}, { removeOnComplete: true }))
cron.schedule('* * * * *', () => queues.live.add('tick', {}, { removeOnComplete: true })) // Run every minute

// Daily snapshot at 05:10 UTC
cron.schedule('10 5 * * *', async () => {
  try {
    console.log('📸 Running daily API snapshot...')
    const idx = await runSnapshotAndRevalidate()
    console.log('✅ Snapshot complete. Index at', idx)
  } catch (e) {
    console.error('❌ Snapshot failed:', e)
  }
})

new Worker('pmm-create', async () => pmmCreateHandler(), { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })
new Worker('pmm-alert', async () => pmmAlertHandler(), { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })
new Worker('pmm-live', async () => pmmLiveHandler(), { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })
new Worker('push-broadcast', async (job) => {
  const { title, body, url } = job.data as any
  await fetch(createEmailUrl('/api/push/send'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ secret: process.env.PUSH_API_SECRET, title, body, url }),
  })
}, { connection: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379) } })

  // Bootstrap on startup: if DB has no matches yet, enqueue an immediate create job
  ; (async () => {
    try {
      const res = await db.execute(sql`select count(*)::int as c from matches`)
      const count = (res as any).rows?.[0]?.c ?? 0
      if (count === 0) {
        console.log('🟡 No matches found on startup. Enqueuing immediate pmm-create…')
        await queues.create.add('tick', {}, { removeOnComplete: true })
      } else {
        console.log(`🟢 Matches found on startup: ${count}`)
      }
    } catch (e) {
      console.error('Failed startup bootstrap check:', e)
    }
  })()

console.log('Worker started: PMM.Create (04:00 + hourly), PMM.Alert (*/5), Trial jobs (nudge/expire)')