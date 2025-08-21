CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"slug" text,
	"short_name" text,
	"position" text,
	"jersey_number" text,
	"height" integer,
	"date_of_birth_ts" integer,
	"country_alpha2" text,
	"market_value_eur" integer,
	"extra" jsonb
);
--> statement-breakpoint
CREATE TABLE "trending_players" (
	"player_id" text NOT NULL,
	"event_id" text NOT NULL,
	"rating" integer,
	"payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);
