-- Kickoff Autopilot initial schema and seed
create extension if not exists pgcrypto;

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  slug text unique not null,
  home_team text not null,
  away_team text not null,
  league text,
  kickoff_iso timestamptz not null,
  status text check (status in ('scheduled','live','halftime','finished')) default 'scheduled',
  home_score integer,
  away_score integer,
  stripe_payment_link text,
  trial_link text,
  scorebat_embed text
);
create index if not exists matches_kickoff_idx on public.matches (kickoff_iso);
create index if not exists matches_status_idx on public.matches (status);

create table if not exists public.trial_sessions (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  ip inet,
  fingerprint_hash text,
  device_type text,
  browser_info jsonb,
  start_time timestamptz default now(),
  status text check (status in ('active','expired')) default 'active',
  username text,
  password text
);
create index if not exists trial_sessions_phone_idx on public.trial_sessions (phone);
create index if not exists trial_sessions_ip_idx on public.trial_sessions (ip);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  phone text unique,
  telegram_id text,
  referral_code text unique,
  referred_by text,
  entitlement_expires_at timestamptz,
  email text,
  email_notifications_enabled boolean default true,
  email_verified boolean default false,
  unsubscribe_token text unique
);

create table if not exists public.referral_credits (
  id uuid primary key default gen_random_uuid(),
  purchaser_user_id uuid references public.app_users(id),
  inviter_referral_code text,
  friend_referral_code text,
  created_at timestamptz default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

create table if not exists public.one_time_codes (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  code text not null,
  created_at timestamptz default now(),
  consumed boolean default false
);
create index if not exists otc_phone_idx on public.one_time_codes (phone);

-- simple rate limiting bucket table
create table if not exists public.rate_events (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  created_at timestamptz default now()
);
create index if not exists rate_events_bucket_idx on public.rate_events (bucket);

-- metrics logging table
create table if not exists public.metrics (
  id uuid primary key default gen_random_uuid(),
  event text not null,
  payload jsonb,
  created_at timestamptz default now()
);
create index if not exists metrics_event_idx on public.metrics (event);

-- email notification history table
create table if not exists public.email_notification_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  match_id uuid,
  template_id text,
  psychological_trigger text,
  urgency_level text,
  viewer_count integer,
  user_segment text,
  match_importance text,
  time_remaining text,
  notification_channel text,
  utm_params jsonb,
  session_id text,
  notification_type text,
  variant text,
  test_group text,
  match_teams text,
  kickoff_time timestamptz,
  alert_timing text,
  day_of_week text,
  sent_at timestamptz default now(),
  status text default 'pending',
  error_message text
);
create index if not exists email_notification_history_user_id_idx on public.email_notification_history (user_id);
create index if not exists email_notification_history_match_id_idx on public.email_notification_history (match_id);
create index if not exists email_notification_history_sent_at_idx on public.email_notification_history (sent_at);
create index if not exists email_notification_history_status_idx on public.email_notification_history (status);

-- email templates table
create table if not exists public.email_templates (
  id text primary key,
  name text not null,
  subject text not null,
  html_content text not null,
  text_content text,
  variables jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists email_templates_name_idx on public.email_templates (name);

-- user notification history table
create table if not exists public.user_notification_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  match_id uuid,
  template_id text,
  psychological_trigger text,
  urgency_level text,
  viewer_count integer,
  user_segment text,
  match_importance text,
  time_remaining text,
  notification_channel text,
  utm_params jsonb,
  session_id text,
  notification_type text,
  variant text,
  test_group text,
  match_teams text,
  kickoff_time timestamptz,
  alert_timing text,
  day_of_week text,
  created_at timestamptz default now()
);
create index if not exists user_notification_history_user_id_idx on public.user_notification_history (user_id);
create index if not exists user_notification_history_match_id_idx on public.user_notification_history (match_id);
create index if not exists user_notification_history_created_at_idx on public.user_notification_history (created_at);


-- players table for trending population
create table if not exists public.players (
  id text primary key,
  name text,
  slug text,
  short_name text,
  position text,
  jersey_number text,
  height integer,
  date_of_birth_ts bigint,
  country_alpha2 text,
  market_value_eur bigint,
  extra jsonb
);
create index if not exists players_slug_idx on public.players (slug);

-- trending_players table for trending population
create table if not exists public.trending_players (
  player_id text not null,
  event_id text not null,
  rating numeric,
  payload jsonb,
  created_at timestamptz default now(),
  primary key (player_id, event_id)
);
create index if not exists trending_players_event_id_idx on public.trending_players (event_id);
create index if not exists trending_players_rating_idx on public.trending_players (rating);


