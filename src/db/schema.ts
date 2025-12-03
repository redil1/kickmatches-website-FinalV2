// Players table for trending population
export const players = pgTable('players', {
  id: text('id').primaryKey(),
  name: text('name'),
  slug: text('slug'),
  shortName: text('short_name'),
  position: text('position'),
  jerseyNumber: text('jersey_number'),
  height: integer('height'),
  dateOfBirthTs: integer('date_of_birth_ts'),
  countryAlpha2: text('country_alpha2'),
  marketValueEur: integer('market_value_eur'),
  extra: jsonb('extra')
});

// Trending players table for trending population
export const trendingPlayers = pgTable('trending_players', {
  playerId: text('player_id').notNull(),
  eventId: text('event_id').notNull(),
  rating: doublePrecision('rating'),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  pk: primaryKey(table.playerId, table.eventId)
}));
import { pgTable, text, timestamp, uuid, jsonb, inet, boolean, integer, doublePrecision, primaryKey } from 'drizzle-orm/pg-core'

export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  // External provider event id for deep links (/m/[eventId]-[slug])
  eventId: text('event_id'),
  slug: text('slug').notNull().unique(),
  homeTeam: text('home_team').notNull(),
  awayTeam: text('away_team').notNull(),
  league: text('league'),
  kickoffIso: timestamp('kickoff_iso', { withTimezone: true }).notNull(),
  status: text('status').default('scheduled'),
  homeScore: integer('home_score'),
  awayScore: integer('away_score'),
  stripePaymentLink: text('stripe_payment_link'),
  trialLink: text('trial_link'),
  scorebatEmbed: text('scorebat_embed')
})

export const trialSessions = pgTable('trial_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull(),
  email: text('email'),
  ip: inet('ip'),
  fingerprintHash: text('fingerprint_hash'),
  deviceType: text('device_type'),
  browserInfo: jsonb('browser_info'),
  startTime: timestamp('start_time', { withTimezone: true }).defaultNow(),
  status: text('status').default('active'),
  username: text('username'),
  password: text('password')
})

export const appUsers = pgTable('app_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').unique(),
  telegramId: text('telegram_id'),
  referralCode: text('referral_code').unique(),
  referredBy: text('referred_by'),
  entitlementExpiresAt: timestamp('entitlement_expires_at', { withTimezone: true }),
  email: text('email'),
  emailNotificationsEnabled: boolean('email_notifications_enabled').default(true),
  emailVerified: boolean('email_verified').default(false),
  unsubscribeToken: text('unsubscribe_token').unique()
})

export const referralCredits = pgTable('referral_credits', {
  id: uuid('id').defaultRandom().primaryKey(),
  purchaserUserId: uuid('purchaser_user_id'),
  inviterReferralCode: text('inviter_referral_code'),
  friendReferralCode: text('friend_referral_code'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export const oneTimeCodes = pgTable('one_time_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  phone: text('phone').notNull(),
  code: text('code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  consumed: boolean('consumed').default(false)
})

export const rateEvents = pgTable('rate_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  bucket: text('bucket').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})

export const metrics = pgTable('metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  event: text('event').notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const emailNotificationHistory = pgTable('email_notification_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  matchId: uuid('match_id'),
  templateId: text('template_id'),
  psychologicalTrigger: text('psychological_trigger'),
  urgencyLevel: text('urgency_level'),
  viewerCount: integer('viewer_count'),
  userSegment: text('user_segment'),
  matchImportance: text('match_importance'),
  timeRemaining: text('time_remaining'),
  notificationChannel: text('notification_channel'),
  utmParams: jsonb('utm_params'),
  sessionId: text('session_id'),
  notificationType: text('notification_type'),
  variant: text('variant'),
  testGroup: text('test_group'),
  matchTeams: text('match_teams'),
  kickoffTime: timestamp('kickoff_time', { withTimezone: true }),
  alertTiming: text('alert_timing'),
  dayOfWeek: text('day_of_week'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow(),
  status: text('status').default('pending'),
  errorMessage: text('error_message')
})

export const emailTemplates = pgTable('email_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'),
  variables: jsonb('variables'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow()
})

export const userNotificationHistory = pgTable('user_notification_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id'),
  matchId: uuid('match_id'),
  templateId: text('template_id'),
  psychologicalTrigger: text('psychological_trigger'),
  urgencyLevel: text('urgency_level'),
  viewerCount: integer('viewer_count'),
  userSegment: text('user_segment'),
  matchImportance: text('match_importance'),
  timeRemaining: text('time_remaining'),
  notificationChannel: text('notification_channel'),
  utmParams: jsonb('utm_params'),
  sessionId: text('session_id'),
  notificationType: text('notification_type'),
  variant: text('variant'),
  testGroup: text('test_group'),
  matchTeams: text('match_teams'),
  kickoffTime: timestamp('kickoff_time', { withTimezone: true }),
  alertTiming: text('alert_timing'),
  dayOfWeek: text('day_of_week'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow()
})


