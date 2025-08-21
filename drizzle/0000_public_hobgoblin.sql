CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text,
	"telegram_id" text,
	"referral_code" text,
	"referred_by" text,
	"entitlement_expires_at" timestamp with time zone,
	"email" text,
	"email_notifications_enabled" boolean DEFAULT true,
	"email_verified" boolean DEFAULT false,
	"unsubscribe_token" text,
	CONSTRAINT "app_users_phone_unique" UNIQUE("phone"),
	CONSTRAINT "app_users_referral_code_unique" UNIQUE("referral_code"),
	CONSTRAINT "app_users_unsubscribe_token_unique" UNIQUE("unsubscribe_token")
);
--> statement-breakpoint
CREATE TABLE "email_notification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"match_id" uuid,
	"template_id" text,
	"psychological_trigger" text,
	"urgency_level" text,
	"viewer_count" integer,
	"user_segment" text,
	"match_importance" text,
	"time_remaining" text,
	"notification_channel" text,
	"utm_params" jsonb,
	"session_id" text,
	"notification_type" text,
	"variant" text,
	"test_group" text,
	"match_teams" text,
	"kickoff_time" timestamp with time zone,
	"alert_timing" text,
	"day_of_week" text,
	"sent_at" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'pending',
	"error_message" text
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"html_content" text NOT NULL,
	"text_content" text,
	"variables" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text,
	"slug" text NOT NULL,
	"home_team" text NOT NULL,
	"away_team" text NOT NULL,
	"league" text,
	"kickoff_iso" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled',
	"stripe_payment_link" text,
	"trial_link" text,
	"scorebat_embed" text,
	CONSTRAINT "matches_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "one_time_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"consumed" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "rate_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bucket" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "referral_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchaser_user_id" uuid,
	"inviter_referral_code" text,
	"friend_referral_code" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "trial_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"ip" "inet",
	"fingerprint_hash" text,
	"device_type" text,
	"browser_info" jsonb,
	"start_time" timestamp with time zone DEFAULT now(),
	"status" text DEFAULT 'active',
	"username" text,
	"password" text
);
--> statement-breakpoint
CREATE TABLE "user_notification_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"match_id" uuid,
	"template_id" text,
	"psychological_trigger" text,
	"urgency_level" text,
	"viewer_count" integer,
	"user_segment" text,
	"match_importance" text,
	"time_remaining" text,
	"notification_channel" text,
	"utm_params" jsonb,
	"session_id" text,
	"notification_type" text,
	"variant" text,
	"test_group" text,
	"match_teams" text,
	"kickoff_time" timestamp with time zone,
	"alert_timing" text,
	"day_of_week" text,
	"created_at" timestamp with time zone DEFAULT now()
);
