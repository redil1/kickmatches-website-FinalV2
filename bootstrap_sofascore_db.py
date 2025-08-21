#!/usr/bin/env python3
"""
Bootstrap a local Postgres database and populate it end-to-end
from the SofaScore-like API at http://69.197.168.221:8004.

Usage:
  # Ensure Postgres is running locally and you have a user with createdb rights
  # Optionally export DB connection envs
  export PGHOST=localhost
  export PGPORT=5432
  export PGUSER=postgres
  # Optional: only if your server requires a password
  # export PGPASSWORD=your_password
  export DB_NAME=sofascore_local
  export API_BASE=http://69.197.168.221:8004
  # Alternatively, provide a single connection string and skip DB creation
  # export DATABASE_URL=postgresql://user:pass@localhost:5432/sofascore_local

  # Install deps
  python3 -m venv .venv && . .venv/bin/activate
  pip install --upgrade pip
  pip install psycopg2-binary requests

  # Run the bootstrap
  python scripts/bootstrap_sofascore_db.py

This script:
- Creates database (if not exists)
- Creates all tables
- Fetches and upserts:
  * Categories
  * Scheduled events for today
  * Event details (venue/referee)
  * Lineups and lineup players
  * Player heatmaps for starters
  * Player transfer history for starters

Notes:
- Some API endpoints have signature/availability quirks. This script
  uses the ones that were verified working during testing.
- You can re-run safely; UPSERTs ensure idempotency.
"""
from __future__ import annotations

import os
import sys
import json
import time
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
import psycopg2
from psycopg2 import extensions as pg_ext
import psycopg2.extras
from psycopg2.extensions import connection as PGConnection


# ---------------
# Configuration
# ---------------
API_BASE = os.environ.get("API_BASE", "http://69.197.168.221:8004")
PGHOST = os.environ.get("PGHOST", "localhost")
PGPORT = int(os.environ.get("PGPORT", "5432"))
PGUSER = os.environ.get("PGUSER", "postgres")
# Default password set to 'root' per user environment
PGPASSWORD = os.environ.get("PGPASSWORD", "root")
DB_NAME = os.environ.get("DB_NAME", "sofascore_local")
DATABASE_URL = os.environ.get("DATABASE_URL") or os.environ.get("PGURI")

REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "20"))
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

# Bootstrap pacing controls
MAX_EVENTS = int(os.environ.get("BOOTSTRAP_MAX_EVENTS", "10"))
MAX_STARTERS = int(os.environ.get("BOOTSTRAP_MAX_STARTERS", "6"))
FETCH_TRANSFERS = os.environ.get("BOOTSTRAP_FETCH_TRANSFERS", "1").lower() in ("1", "true", "yes", "y")
FETCH_HEATMAPS = os.environ.get("BOOTSTRAP_FETCH_HEATMAPS", "1").lower() in ("1", "true", "yes", "y")
FETCH_STATISTICS = os.environ.get("BOOTSTRAP_FETCH_STATISTICS", "1").lower() in ("1", "true", "yes", "y")
FETCH_STANDINGS = os.environ.get("BOOTSTRAP_FETCH_STANDINGS", "1").lower() in ("1", "true", "yes", "y")
FETCH_TOURNAMENT_FEATURES = os.environ.get("BOOTSTRAP_FETCH_TOURNAMENT_FEATURES", "1").lower() in ("1", "true", "yes", "y")
FETCH_TRENDING = os.environ.get("BOOTSTRAP_FETCH_TRENDING", "1").lower() in ("1", "true", "yes", "y")
FETCH_SUGGESTIONS = os.environ.get("BOOTSTRAP_FETCH_SUGGESTIONS", "1").lower() in ("1", "true", "yes", "y")
FETCH_LIVE_COUNTS = os.environ.get("BOOTSTRAP_FETCH_LIVE_COUNTS", "1").lower() in ("1", "true", "yes", "y")
FETCH_IMAGES = os.environ.get("BOOTSTRAP_FETCH_IMAGES", "1").lower() in ("1", "true", "yes", "y")

# Rate limiting for image downloads
IMAGE_DOWNLOAD_DELAY = float(os.environ.get("BOOTSTRAP_IMAGE_DELAY", "0.5"))

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("bootstrap")


# ---------------
# SQL Schema
# ---------------
SCHEMA_SQL = r"""
CREATE TABLE IF NOT EXISTS sports (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS countries (
  alpha2 CHAR(2) PRIMARY KEY,
  alpha3 CHAR(3),
  name TEXT NOT NULL,
  slug TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  sport_id INT NOT NULL REFERENCES sports(id),
  flag TEXT,
  alpha2 CHAR(2),
  translations JSONB
);

CREATE TABLE IF NOT EXISTS unique_tournaments (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  category_id INT NOT NULL REFERENCES categories(id),
  user_count INT,
  flags JSONB,
  colors JSONB,
  translations JSONB
);

CREATE TABLE IF NOT EXISTS tournaments (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  unique_tournament_id INT REFERENCES unique_tournaments(id),
  category_id INT REFERENCES categories(id),
  priority INT,
  translations JSONB
);

CREATE TABLE IF NOT EXISTS seasons (
  id INT PRIMARY KEY,
  tournament_id INT REFERENCES tournaments(id),
  name TEXT,
  year TEXT,
  editor BOOLEAN
);

CREATE TABLE IF NOT EXISTS teams (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  short_name TEXT,
  country_alpha2 CHAR(2) REFERENCES countries(alpha2),
  national BOOLEAN,
  disabled BOOLEAN,
  type INT,
  foundation_ts BIGINT,
  colors JSONB,
  translations JSONB
);

CREATE TABLE IF NOT EXISTS players (
  id INT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  short_name TEXT,
  position TEXT,
  jersey_number TEXT,
  height INT,
  date_of_birth_ts BIGINT,
  country_alpha2 CHAR(2) REFERENCES countries(alpha2),
  market_value_eur BIGINT,
  extra JSONB
);

CREATE TABLE IF NOT EXISTS venues (
  id INT PRIMARY KEY,
  name TEXT,
  slug TEXT,
  city TEXT,
  capacity INT,
  country_alpha2 CHAR(2) REFERENCES countries(alpha2),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  translations JSONB
);

CREATE TABLE IF NOT EXISTS referees (
  id INT PRIMARY KEY,
  name TEXT,
  country_alpha2 CHAR(2) REFERENCES countries(alpha2),
  stats JSONB
);

CREATE TABLE IF NOT EXISTS events (
  id BIGINT PRIMARY KEY,
  slug TEXT,
  tournament_id INT REFERENCES tournaments(id),
  season_id INT REFERENCES seasons(id),
  round INT,
  round_name TEXT,
  status_code INT,
  status_desc TEXT,
  status_type TEXT,
  winner_code INT,
  start_ts BIGINT,
  final_result_only BOOLEAN,
  venue_id INT REFERENCES venues(id),
  referee_id INT REFERENCES referees(id),
  has_player_stats BOOLEAN,
  has_player_heatmap BOOLEAN,
  extra JSONB
);

CREATE TABLE IF NOT EXISTS event_teams (
  event_id BIGINT REFERENCES events(id),
  team_id INT REFERENCES teams(id),
  side TEXT CHECK (side IN ('home','away')),
  PRIMARY KEY (event_id, side)
);

CREATE TABLE IF NOT EXISTS event_scores (
  event_id BIGINT PRIMARY KEY REFERENCES events(id),
  home_current INT,
  away_current INT,
  home_display INT,
  away_display INT,
  home_p1 INT,
  away_p1 INT,
  home_p2 INT,
  away_p2 INT,
  home_normaltime INT,
  away_normaltime INT,
  home_pen INT,
  away_pen INT
);

CREATE TABLE IF NOT EXISTS lineups (
  event_id BIGINT REFERENCES events(id),
  team_id INT REFERENCES teams(id),
  formation TEXT,
  confirmed BOOLEAN,
  PRIMARY KEY (event_id, team_id)
);

CREATE TABLE IF NOT EXISTS lineup_players (
  event_id BIGINT,
  team_id INT,
  player_id INT REFERENCES players(id),
  position TEXT,
  shirt_number INT,
  role TEXT CHECK (role IN ('starter','sub')),
  country_alpha2 CHAR(2),
  PRIMARY KEY (event_id, team_id, player_id, role),
  FOREIGN KEY (event_id, team_id) REFERENCES lineups(event_id, team_id)
);

CREATE TABLE IF NOT EXISTS player_heatmaps (
  event_id BIGINT REFERENCES events(id),
  player_id INT REFERENCES players(id),
  seq INT,
  x INT,
  y INT,
  PRIMARY KEY (event_id, player_id, seq)
);

CREATE TABLE IF NOT EXISTS player_transfers (
  id BIGINT PRIMARY KEY,
  player_id INT REFERENCES players(id),
  from_team_id INT REFERENCES teams(id),
  to_team_id INT REFERENCES teams(id),
  transfer_fee_eur BIGINT,
  transfer_fee_desc TEXT,
  transfer_ts BIGINT
);

CREATE TABLE IF NOT EXISTS player_statistics (
  player_id INT,
  season_id INT,
  tournament_id INT,
  stats JSONB,
  PRIMARY KEY (player_id, season_id, tournament_id)
);

CREATE TABLE IF NOT EXISTS team_statistics (
  team_id INT,
  season_id INT,
  tournament_id INT,
  stats JSONB,
  PRIMARY KEY (team_id, season_id, tournament_id)
);

CREATE TABLE IF NOT EXISTS standings (
  tournament_id INT,
  season_id INT,
  group_name TEXT,
  team_id INT,
  rank INT,
  played INT,
  wins INT,
  draws INT,
  losses INT,
  gf INT,
  ga INT,
  gd INT,
  points INT,
  extra JSONB,
  PRIMARY KEY (tournament_id, season_id, group_name, team_id)
);

CREATE TABLE IF NOT EXISTS tournament_featured_events (
  tournament_id INT,
  event_id BIGINT,
  PRIMARY KEY (tournament_id, event_id)
);

CREATE TABLE IF NOT EXISTS tournament_videos (
  tournament_id INT,
  season_id INT,
  video_id TEXT,
  payload JSONB,
  PRIMARY KEY (tournament_id, season_id, video_id)
);

CREATE TABLE IF NOT EXISTS trending_players (
  player_id INT,
  event_id BIGINT,
  rating NUMERIC,
  payload JSONB,
  PRIMARY KEY (player_id, event_id)
);

CREATE TABLE IF NOT EXISTS suggestions (
  entity_type TEXT CHECK (entity_type IN ('team','player','unique_tournament','tournament')),
  entity_id TEXT,
  score INT,
  payload JSONB,
  PRIMARY KEY (entity_type, entity_id)
);

CREATE TABLE IF NOT EXISTS live_category_counts (
  category_id INT PRIMARY KEY,
  live_count INT
);

CREATE TABLE IF NOT EXISTS event_count_by_sport (
  sport_slug TEXT PRIMARY KEY,
  live INT,
  total INT
);

CREATE TABLE IF NOT EXISTS images_player (
  player_id INT PRIMARY KEY,
  url TEXT,
  kind TEXT,
  fetched_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS images_team (
  team_id INT,
  size TEXT CHECK (size IN ('full','small')),
  url TEXT,
  fetched_at TIMESTAMP DEFAULT now(),
  PRIMARY KEY (team_id, size)
);

CREATE TABLE IF NOT EXISTS images_tournament (
  tournament_id INT PRIMARY KEY,
  url TEXT,
  fetched_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_start_ts ON events(start_ts);
CREATE INDEX IF NOT EXISTS idx_event_teams_team ON event_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_lineup_players_player ON lineup_players(player_id);
"""


# ---------------
# DB Utilities
# ---------------

def _connect(dbname: str) -> PGConnection:
    """Connect to Postgres. Uses DATABASE_URL if provided, else individual params.

    If no password is supplied, we avoid passing it so libpq can use
    .pgpass or peer/ident auth as configured.
    """
    if DATABASE_URL:
        # If DATABASE_URL is provided, assume it points to the intended DB
        return psycopg2.connect(DATABASE_URL)

    dsn: Dict[str, Any] = {
        "host": PGHOST,
        "port": PGPORT,
        "user": PGUSER,
        "dbname": dbname,
    }
    if PGPASSWORD:
        dsn["password"] = PGPASSWORD
    return psycopg2.connect(**dsn)


def ensure_database_exists() -> None:
    """Create the database if it does not exist.

    If DATABASE_URL is provided, skip creation and assume the DB exists.
    """
    if DATABASE_URL:
        logger.info("DATABASE_URL provided; skipping database creation step")
        return
    # Try to connect to a maintenance DB and create DB_NAME if needed, using autocommit
    def _try_create_db(maintenance_db: str) -> bool:
        try:
            conn = psycopg2.connect(
                host=PGHOST,
                port=PGPORT,
                user=PGUSER,
                dbname=maintenance_db,
                **({"password": PGPASSWORD} if PGPASSWORD else {}),
            )
            try:
                conn.set_isolation_level(pg_ext.ISOLATION_LEVEL_AUTOCOMMIT)
                with conn.cursor() as cur:
                    cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
                    if cur.fetchone():
                        logger.info("Database %s already exists", DB_NAME)
                        return True
                    cur.execute(f"CREATE DATABASE {DB_NAME}")
                    logger.info("Created database %s", DB_NAME)
                    return True
            finally:
                conn.close()
        except Exception as e:
            logger.warning("DB create via %s failed: %s", maintenance_db, e)
            return False

    if not (_try_create_db("postgres") or _try_create_db("template1")):
        logger.warning("Could not ensure database exists (might already exist or insufficient privileges)")


def run_schema(conn: PGConnection) -> None:
    with conn.cursor() as cur:
        cur.execute(SCHEMA_SQL)
    conn.commit()
    logger.info("Schema applied")


def upsert(conn: PGConnection, sql: str, params: Tuple[Any, ...]) -> None:
    with conn.cursor() as cur:
        cur.execute(sql, params)


def commit(conn: PGConnection) -> None:
    conn.commit()


# ---------------
# API Utilities
# ---------------

def api_get(path: str, params: Optional[Dict[str, Any]] = None) -> Any:
    url = f"{API_BASE}{path}"
    r = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
    r.raise_for_status()
    try:
        data = r.json()
    except Exception:
        return r.text
    return data


# ---------------
# Upsert SQLs
# ---------------
UPSERT_SPORT = (
    "INSERT INTO sports (id, name, slug) VALUES (%s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, slug = EXCLUDED.slug"
)

UPSERT_COUNTRY = (
    "INSERT INTO countries (alpha2, alpha3, name, slug) VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (alpha2) DO UPDATE SET alpha3 = EXCLUDED.alpha3, name = EXCLUDED.name, slug = EXCLUDED.slug"
)

UPSERT_CATEGORY = (
    "INSERT INTO categories (id, name, slug, sport_id, flag, alpha2, translations) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, sport_id=EXCLUDED.sport_id, flag=EXCLUDED.flag, alpha2=EXCLUDED.alpha2, translations=EXCLUDED.translations"
)

UPSERT_UNIQUE_TOURNAMENT = (
    "INSERT INTO unique_tournaments (id, name, slug, category_id, user_count, flags, colors, translations) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, category_id=EXCLUDED.category_id, user_count=EXCLUDED.user_count, flags=EXCLUDED.flags, colors=EXCLUDED.colors, translations=EXCLUDED.translations"
)

UPSERT_TOURNAMENT = (
    "INSERT INTO tournaments (id, name, slug, unique_tournament_id, category_id, priority, translations) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, unique_tournament_id=EXCLUDED.unique_tournament_id, category_id=EXCLUDED.category_id, priority=EXCLUDED.priority, translations=EXCLUDED.translations"
)

UPSERT_SEASON = (
    "INSERT INTO seasons (id, tournament_id, name, year, editor) VALUES (%s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET tournament_id=EXCLUDED.tournament_id, name=EXCLUDED.name, year=EXCLUDED.year, editor=EXCLUDED.editor"
)

UPSERT_TEAM = (
    "INSERT INTO teams (id, name, slug, short_name, country_alpha2, national, disabled, type, foundation_ts, colors, translations) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, short_name=EXCLUDED.short_name, country_alpha2=EXCLUDED.country_alpha2, national=EXCLUDED.national, disabled=EXCLUDED.disabled, type=EXCLUDED.type, foundation_ts=EXCLUDED.foundation_ts, colors=EXCLUDED.colors, translations=EXCLUDED.translations"
)

UPSERT_PLAYER = (
    "INSERT INTO players (id, name, slug, short_name, position, jersey_number, height, date_of_birth_ts, country_alpha2, market_value_eur, extra) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, short_name=EXCLUDED.short_name, position=EXCLUDED.position, jersey_number=EXCLUDED.jersey_number, height=EXCLUDED.height, date_of_birth_ts=EXCLUDED.date_of_birth_ts, country_alpha2=EXCLUDED.country_alpha2, market_value_eur=EXCLUDED.market_value_eur, extra=EXCLUDED.extra"
)

UPSERT_VENUE = (
    "INSERT INTO venues (id, name, slug, city, capacity, country_alpha2, lat, lon, translations) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug, city=EXCLUDED.city, capacity=EXCLUDED.capacity, country_alpha2=EXCLUDED.country_alpha2, lat=EXCLUDED.lat, lon=EXCLUDED.lon, translations=EXCLUDED.translations"
)

UPSERT_REFEREE = (
    "INSERT INTO referees (id, name, country_alpha2, stats) VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, country_alpha2=EXCLUDED.country_alpha2, stats=EXCLUDED.stats"
)

UPSERT_EVENT = (
    "INSERT INTO events (id, slug, tournament_id, season_id, round, round_name, status_code, status_desc, status_type, winner_code, start_ts, final_result_only, venue_id, referee_id, has_player_stats, has_player_heatmap, extra) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET slug=EXCLUDED.slug, tournament_id=EXCLUDED.tournament_id, season_id=EXCLUDED.season_id, round=EXCLUDED.round, round_name=EXCLUDED.round_name, status_code=EXCLUDED.status_code, status_desc=EXCLUDED.status_desc, status_type=EXCLUDED.status_type, winner_code=EXCLUDED.winner_code, start_ts=EXCLUDED.start_ts, final_result_only=EXCLUDED.final_result_only, venue_id=EXCLUDED.venue_id, referee_id=EXCLUDED.referee_id, has_player_stats=EXCLUDED.has_player_stats, has_player_heatmap=EXCLUDED.has_player_heatmap, extra=EXCLUDED.extra"
)

UPSERT_EVENT_TEAM = (
    "INSERT INTO event_teams (event_id, team_id, side) VALUES (%s, %s, %s) "
    "ON CONFLICT (event_id, side) DO UPDATE SET team_id = EXCLUDED.team_id"
)

UPSERT_EVENT_SCORES = (
    "INSERT INTO event_scores (event_id, home_current, away_current, home_display, away_display, home_p1, away_p1, home_p2, away_p2, home_normaltime, away_normaltime, home_pen, away_pen) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (event_id) DO UPDATE SET home_current=EXCLUDED.home_current, away_current=EXCLUDED.away_current, home_display=EXCLUDED.home_display, away_display=EXCLUDED.away_display, home_p1=EXCLUDED.home_p1, away_p1=EXCLUDED.away_p1, home_p2=EXCLUDED.home_p2, away_p2=EXCLUDED.away_p2, home_normaltime=EXCLUDED.home_normaltime, away_normaltime=EXCLUDED.away_normaltime, home_pen=EXCLUDED.home_pen, away_pen=EXCLUDED.away_pen"
)

UPSERT_LINEUP = (
    "INSERT INTO lineups (event_id, team_id, formation, confirmed) VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (event_id, team_id) DO UPDATE SET formation=EXCLUDED.formation, confirmed=EXCLUDED.confirmed"
)

UPSERT_LINEUP_PLAYER = (
    "INSERT INTO lineup_players (event_id, team_id, player_id, position, shirt_number, role, country_alpha2) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (event_id, team_id, player_id, role) DO UPDATE SET position=EXCLUDED.position, shirt_number=EXCLUDED.shirt_number, country_alpha2=EXCLUDED.country_alpha2"
)

UPSERT_PLAYER_HEATMAP_POINT = (
    "INSERT INTO player_heatmaps (event_id, player_id, seq, x, y) VALUES (%s, %s, %s, %s, %s) "
    "ON CONFLICT (event_id, player_id, seq) DO NOTHING"
)

UPSERT_PLAYER_TRANSFER = (
    "INSERT INTO player_transfers (id, player_id, from_team_id, to_team_id, transfer_fee_eur, transfer_fee_desc, transfer_ts) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (id) DO UPDATE SET player_id=EXCLUDED.player_id, from_team_id=EXCLUDED.from_team_id, to_team_id=EXCLUDED.to_team_id, transfer_fee_eur=EXCLUDED.transfer_fee_eur, transfer_fee_desc=EXCLUDED.transfer_fee_desc, transfer_ts=EXCLUDED.transfer_ts"
)

UPSERT_PLAYER_STATISTICS = (
    "INSERT INTO player_statistics (player_id, season_id, tournament_id, stats) "
    "VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (player_id, season_id, tournament_id) DO UPDATE SET stats=EXCLUDED.stats"
)

UPSERT_TEAM_STATISTICS = (
    "INSERT INTO team_statistics (team_id, season_id, tournament_id, stats) "
    "VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (team_id, season_id, tournament_id) DO UPDATE SET stats=EXCLUDED.stats"
)

UPSERT_STANDINGS = (
    "INSERT INTO standings (tournament_id, season_id, group_name, team_id, rank, played, wins, draws, losses, gf, ga, gd, points, extra) "
    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
    "ON CONFLICT (tournament_id, season_id, group_name, team_id) DO UPDATE SET rank=EXCLUDED.rank, played=EXCLUDED.played, wins=EXCLUDED.wins, draws=EXCLUDED.draws, losses=EXCLUDED.losses, gf=EXCLUDED.gf, ga=EXCLUDED.ga, gd=EXCLUDED.gd, points=EXCLUDED.points, extra=EXCLUDED.extra"
)

UPSERT_TOURNAMENT_FEATURED_EVENT = (
    "INSERT INTO tournament_featured_events (tournament_id, event_id) "
    "VALUES (%s, %s) "
    "ON CONFLICT (tournament_id, event_id) DO NOTHING"
)

UPSERT_TOURNAMENT_VIDEO = (
    "INSERT INTO tournament_videos (tournament_id, season_id, video_id, payload) "
    "VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (tournament_id, season_id, video_id) DO UPDATE SET payload=EXCLUDED.payload"
)

UPSERT_TRENDING_PLAYER = (
    "INSERT INTO trending_players (player_id, event_id, rating, payload) "
    "VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (player_id, event_id) DO UPDATE SET rating=EXCLUDED.rating, payload=EXCLUDED.payload"
)

UPSERT_SUGGESTION = (
    "INSERT INTO suggestions (entity_type, entity_id, score, payload) "
    "VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (entity_type, entity_id) DO UPDATE SET score=EXCLUDED.score, payload=EXCLUDED.payload"
)

UPSERT_LIVE_CATEGORY_COUNT = (
    "INSERT INTO live_category_counts (category_id, live_count) "
    "VALUES (%s, %s) "
    "ON CONFLICT (category_id) DO UPDATE SET live_count=EXCLUDED.live_count"
)

UPSERT_EVENT_COUNT_BY_SPORT = (
    "INSERT INTO event_count_by_sport (sport_slug, live, total) "
    "VALUES (%s, %s, %s) "
    "ON CONFLICT (sport_slug) DO UPDATE SET live=EXCLUDED.live, total=EXCLUDED.total"
)

UPSERT_PLAYER_IMAGE = (
    "INSERT INTO images_player (player_id, url, kind, fetched_at) "
    "VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (player_id) DO UPDATE SET url=EXCLUDED.url, kind=EXCLUDED.kind, fetched_at=EXCLUDED.fetched_at"
)

UPSERT_TEAM_IMAGE = (
    "INSERT INTO images_team (team_id, size, url, fetched_at) "
    "VALUES (%s, %s, %s, %s) "
    "ON CONFLICT (team_id, size) DO UPDATE SET url=EXCLUDED.url, fetched_at=EXCLUDED.fetched_at"
)

UPSERT_TOURNAMENT_IMAGE = (
    "INSERT INTO images_tournament (tournament_id, url, fetched_at) "
    "VALUES (%s, %s, %s) "
    "ON CONFLICT (tournament_id) DO UPDATE SET url=EXCLUDED.url, fetched_at=EXCLUDED.fetched_at"
)


# ---------------
# Populate helpers
# ---------------

def seed_sports(conn: PGConnection) -> None:
    # Seed Football with id=1, as seen in payloads
    upsert(conn, UPSERT_SPORT, (1, "Football", "football"))


def upsert_country_from_obj(conn: PGConnection, obj: Dict[str, Any]) -> Optional[str]:
    if not obj:
        return None
    alpha2 = obj.get("alpha2")
    if not alpha2:
        return None
    upsert(
        conn,
        UPSERT_COUNTRY,
        (
            alpha2,
            obj.get("alpha3"),
            obj.get("name"),
            obj.get("slug"),
        ),
    )
    return alpha2


def ingest_categories(conn: PGConnection) -> None:
    try:
        data = api_get("/football/categories")
        cats = data.get("success") and data.get("data", {}).get("categories")
        if not cats:
            logger.warning("No categories returned")
            return
        for c in cats:
            sport = c.get("sport") or {}
            sport_id = sport.get("id") or 1
            upsert(
                conn,
                UPSERT_CATEGORY,
                (
                    c.get("id"),
                    c.get("name"),
                    c.get("slug"),
                    sport_id,
                    c.get("flag"),
                    c.get("alpha2"),
                    psycopg2.extras.Json(c.get("fieldTranslations") or {}),
                ),
            )
        commit(conn)
        logger.info("Ingested %d categories", len(cats))
    except Exception as e:
        logger.exception("Failed ingesting categories: %s", e)


def upsert_team_from_obj(conn: PGConnection, t: Dict[str, Any]) -> None:
    country_alpha2 = None
    if t.get("country"):
        country_alpha2 = upsert_country_from_obj(conn, t["country"]) or None
    upsert(
        conn,
        UPSERT_TEAM,
        (
            t.get("id"),
            t.get("name"),
            t.get("slug"),
            t.get("shortName"),
            country_alpha2,
            t.get("national"),
            t.get("disabled"),
            t.get("type"),
            None,  # foundation_ts not consistently present
            psycopg2.extras.Json(t.get("teamColors") or {}),
            psycopg2.extras.Json(t.get("fieldTranslations") or {}),
        ),
    )


def upsert_unique_tournament_from_obj(conn: PGConnection, ut: Dict[str, Any]) -> None:
    cat = ut.get("category") or {}
    upsert(
        conn,
        UPSERT_UNIQUE_TOURNAMENT,
        (
            ut.get("id"),
            ut.get("name"),
            ut.get("slug"),
            cat.get("id"),
            ut.get("userCount"),
            psycopg2.extras.Json({"hasPerformanceGraphFeature": ut.get("hasPerformanceGraphFeature"), "hasEventPlayerStatistics": ut.get("hasEventPlayerStatistics"), "displayInverseHomeAwayTeams": ut.get("displayInverseHomeAwayTeams")}),
            psycopg2.extras.Json({"primary": None, "secondary": None}),
            psycopg2.extras.Json(ut.get("fieldTranslations") or {}),
        ),
    )


def upsert_tournament_from_obj(conn: PGConnection, t: Dict[str, Any]) -> None:
    cat = t.get("category") or {}
    ut = t.get("uniqueTournament") or {}
    upsert(
        conn,
        UPSERT_TOURNAMENT,
        (
            t.get("id"),
            t.get("name"),
            t.get("slug"),
            ut.get("id"),
            cat.get("id"),
            t.get("priority"),
            psycopg2.extras.Json(t.get("fieldTranslations") or {}),
        ),
    )


def upsert_season_from_obj(conn: PGConnection, season: Dict[str, Any], tournament_id: Optional[int]) -> None:
    upsert(
        conn,
        UPSERT_SEASON,
        (
            season.get("id"),
            tournament_id,
            season.get("name"),
            season.get("year"),
            season.get("editor"),
        ),
    )


def ingest_tournaments_catalog(conn: PGConnection) -> None:
    try:
        data = api_get("/football/tournaments")
        results = data.get("success") and data.get("data", {}).get("results")
        if not results:
            logger.warning("No tournaments returned")
            return
        for row in results:
            entity = row.get("entity") or {}
            cat = entity.get("category") or {}
            # ensure category exists
            if cat.get("id"):
                upsert(
                    conn,
                    UPSERT_CATEGORY,
                    (
                        cat.get("id"),
                        cat.get("name"),
                        cat.get("slug"),
                        (cat.get("sport") or {}).get("id") or 1,
                        None,
                        None,
                        psycopg2.extras.Json(cat.get("fieldTranslations") or {}),
                    ),
                )
            # store unique tournament row
            upsert(
                conn,
                UPSERT_UNIQUE_TOURNAMENT,
                (
                    entity.get("id"),
                    entity.get("name"),
                    entity.get("slug"),
                    cat.get("id"),
                    entity.get("userCount"),
                    psycopg2.extras.Json({}),
                    psycopg2.extras.Json({"primary": entity.get("primaryColorHex"), "secondary": entity.get("secondaryColorHex")}),
                    psycopg2.extras.Json(entity.get("fieldTranslations") or {}),
                ),
            )
        commit(conn)
        logger.info("Ingested %d unique tournaments", len(results))
    except Exception as e:
        logger.exception("Failed ingesting tournaments catalog: %s", e)


def _extract_score_val(s: Dict[str, Any], key: str) -> Optional[int]:
    if not isinstance(s, dict):
        return None
    return s.get(key)


def ingest_scheduled_events_for_today(conn: PGConnection) -> List[int]:
    today = datetime.now(timezone.utc).date().isoformat()
    params = {"date": today}
    try:
        data = api_get("/football/events/scheduled", params=params)
        events = data.get("success") and (data.get("data", {}) or {}).get("events", [])
        if not events:
            logger.warning("No scheduled events for %s", today)
            return []
        ingested_event_ids: List[int] = []
        for e in events:
            # unique tournament and tournament rows
            ut = e.get("tournament", {}).get("uniqueTournament") or {}
            if ut:
                upsert_unique_tournament_from_obj(conn, ut)
            tournament = e.get("tournament") or {}
            if tournament:
                upsert_tournament_from_obj(conn, tournament)
            # season
            season = e.get("season") or {}
            if season:
                upsert_season_from_obj(conn, season, tournament.get("id"))
            # teams
            home = e.get("homeTeam") or {}
            away = e.get("awayTeam") or {}
            if home:
                upsert_team_from_obj(conn, home)
            if away:
                upsert_team_from_obj(conn, away)
            # event core
            status = e.get("status") or {}
            round_info = e.get("roundInfo") or {}
            event_id = e.get("id")
            upsert(
                conn,
                UPSERT_EVENT,
                (
                    event_id,
                    e.get("slug"),
                    tournament.get("id"),
                    season.get("id"),
                    round_info.get("round"),
                    round_info.get("name"),
                    status.get("code"),
                    status.get("description"),
                    status.get("type"),
                    e.get("winnerCode"),
                    e.get("startTimestamp"),
                    e.get("finalResultOnly"),
                    None,
                    None,
                    e.get("hasEventPlayerStatistics"),
                    e.get("hasEventPlayerHeatMap"),
                    psycopg2.extras.Json({"priority": tournament.get("priority"), "detailId": e.get("detailId")}),
                ),
            )
            # link teams to event
            if home.get("id"):
                upsert(conn, UPSERT_EVENT_TEAM, (event_id, home.get("id"), "home"))
            if away.get("id"):
                upsert(conn, UPSERT_EVENT_TEAM, (event_id, away.get("id"), "away"))
            # scores
            hs = e.get("homeScore") or {}
            as_ = e.get("awayScore") or {}
            upsert(
                conn,
                UPSERT_EVENT_SCORES,
                (
                    event_id,
                    _extract_score_val(hs, "current"),
                    _extract_score_val(as_, "current"),
                    _extract_score_val(hs, "display"),
                    _extract_score_val(as_, "display"),
                    _extract_score_val(hs, "period1"),
                    _extract_score_val(as_, "period1"),
                    _extract_score_val(hs, "period2"),
                    _extract_score_val(as_, "period2"),
                    _extract_score_val(hs, "normaltime"),
                    _extract_score_val(as_, "normaltime"),
                    _extract_score_val(hs, "penalties"),
                    _extract_score_val(as_, "penalties"),
                ),
            )
            ingested_event_ids.append(int(event_id))
        commit(conn)
        logger.info("Ingested %d scheduled events for %s", len(ingested_event_ids), today)
        return ingested_event_ids
    except Exception as e:
        logger.exception("Failed ingesting scheduled events: %s", e)
        return []


def enrich_event_details(conn: PGConnection, event_id: int) -> None:
    try:
        data = api_get("/football/event/details", params={"event_id": event_id})
        event = data.get("success") and (data.get("data") or {}).get("event")
        if not event:
            return
        # Venue
        venue = event.get("venue") or {}
        venue_id = venue.get("id")
        if venue_id:
            country_alpha2 = None
            if venue.get("country"):
                country_alpha2 = upsert_country_from_obj(conn, venue["country"]) or None
            coords = venue.get("venueCoordinates") or {}
            upsert(
                conn,
                UPSERT_VENUE,
                (
                    venue_id,
                    venue.get("name"),
                    venue.get("slug"),
                    (venue.get("city") or {}).get("name"),
                    (venue.get("stadium") or {}).get("capacity"),
                    country_alpha2,
                    coords.get("latitude"),
                    coords.get("longitude"),
                    psycopg2.extras.Json(venue.get("fieldTranslations") or {}),
                ),
            )
        # Referee
        referee = event.get("referee") or {}
        referee_id = referee.get("id")
        if referee_id:
            alpha2 = None
            if referee.get("country"):
                alpha2 = upsert_country_from_obj(conn, referee["country"]) or None
            upsert(
                conn,
                UPSERT_REFEREE,
                (
                    referee_id,
                    referee.get("name"),
                    alpha2,
                    psycopg2.extras.Json({
                        "yellowCards": referee.get("yellowCards"),
                        "redCards": referee.get("redCards"),
                        "yellowRedCards": referee.get("yellowRedCards"),
                        "games": referee.get("games"),
                    }),
                ),
            )
        # Update event with venue/referee ids & extra
        upsert(
            conn,
            UPSERT_EVENT,
            (
                event_id,
                event.get("slug"),
                (event.get("tournament") or {}).get("id"),
                (event.get("season") or {}).get("id"),
                (event.get("roundInfo") or {}).get("round"),
                (event.get("roundInfo") or {}).get("name"),
                (event.get("status") or {}).get("code"),
                (event.get("status") or {}).get("description"),
                (event.get("status") or {}).get("type"),
                event.get("winnerCode"),
                event.get("startTimestamp"),
                event.get("finalResultOnly"),
                venue_id,
                referee_id,
                event.get("hasEventPlayerStatistics"),
                event.get("hasEventPlayerHeatMap"),
                psycopg2.extras.Json({"defaultPeriodCount": event.get("defaultPeriodCount"), "defaultPeriodLength": event.get("defaultPeriodLength")}),
            ),
        )
        commit(conn)
    except Exception as e:
        logger.warning("Event %s details enrich failed: %s", event_id, e)


def ingest_lineups(conn: PGConnection, event_id: int) -> Tuple[List[int], List[int]]:
    """Return (home_player_ids, away_player_ids) for starters."""
    try:
        data = api_get("/football/event/lineups", params={"event_id": event_id})
        payload = data.get("success") and data.get("data") or {}
        confirmed = bool(payload.get("confirmed"))
        starters_home: List[int] = []
        starters_away: List[int] = []
        for side_key, collect in (("home_team", starters_home), ("away_team", starters_away)):
            team_block = payload.get(side_key) or {}
            formation = team_block.get("formation")
            # We need team_id from events table (event_teams)
            with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
                cur.execute("SELECT team_id FROM event_teams WHERE event_id=%s AND side=%s", (event_id, "home" if side_key=="home_team" else "away"))
                row = cur.fetchone()
                if not row:
                    continue
                team_id = row[0]
            upsert(conn, UPSERT_LINEUP, (event_id, team_id, formation, confirmed))
            # starters
            for p in (team_block.get("starting_eleven") or []):
                pid = p.get("player_id")
                if pid:
                    collect.append(int(pid))
                # upsert player minimal row
                upsert(
                    conn,
                    UPSERT_PLAYER,
                    (
                        pid,
                        p.get("name"),
                        None,
                        None,
                        p.get("position"),
                        p.get("shirt_number"),
                        None,
                        None,
                        None,
                        None,
                        psycopg2.extras.Json({"source": "lineup"}),
                    ),
                )
                upsert(
                    conn,
                    UPSERT_LINEUP_PLAYER,
                    (
                        event_id,
                        team_id,
                        pid,
                        p.get("position"),
                        p.get("shirt_number"),
                        "starter",
                        None,
                    ),
                )
            # subs
            for p in (team_block.get("substitutes") or []):
                pid = p.get("player_id")
                upsert(
                    conn,
                    UPSERT_PLAYER,
                    (
                        pid,
                        p.get("name"),
                        None,
                        None,
                        p.get("position"),
                        p.get("shirt_number"),
                        None,
                        None,
                        None,
                        None,
                        psycopg2.extras.Json({"source": "lineup"}),
                    ),
                )
                upsert(
                    conn,
                    UPSERT_LINEUP_PLAYER,
                    (
                        event_id,
                        team_id,
                        pid,
                        p.get("position"),
                        p.get("shirt_number"),
                        "sub",
                        None,
                    ),
                )
        commit(conn)
        return starters_home, starters_away
    except Exception as e:
        logger.warning("Event %s lineups ingest failed: %s", event_id, e)
        return [], []


def ingest_player_heatmap(conn: PGConnection, event_id: int, player_id: int) -> None:
    try:
        data = api_get("/football/player/heatmap", params={"event_id": event_id, "player_id": player_id})
        points = data.get("success") and (data.get("data") or {}).get("heatmap") or []
        for idx, pt in enumerate(points):
            upsert(
                conn,
                UPSERT_PLAYER_HEATMAP_POINT,
                (event_id, player_id, idx, pt.get("x"), pt.get("y")),
            )
        commit(conn)
    except Exception as e:
        logger.debug("Heatmap fetch failed for event %s player %s: %s", event_id, player_id, e)


def ingest_player_transfers(conn: PGConnection, player_id: int) -> None:
    try:
        data = api_get("/football/player/transfer-history", params={"player_id": player_id})
        history = data.get("success") and (data.get("data") or {}).get("transferHistory") or []
        for tr in history:
            tr_id = tr.get("id")
            p = tr.get("player") or {}
            from_team = tr.get("transferFrom") or {}
            to_team = tr.get("transferTo") or {}
            # ensure teams in DB
            if from_team:
                upsert_team_from_obj(conn, from_team)
            if to_team:
                upsert_team_from_obj(conn, to_team)
            upsert(
                conn,
                UPSERT_PLAYER_TRANSFER,
                (
                    tr_id,
                    p.get("id") or player_id,
                    from_team.get("id"),
                    to_team.get("id"),
                    (tr.get("transferFeeRaw") or {}).get("value"),
                    tr.get("transferFeeDescription"),
                    tr.get("transferDateTimestamp"),
                ),
            )
        commit(conn)
    except Exception as e:
        logger.debug("Transfers fetch failed for player %s: %s", player_id, e)


def ingest_player_statistics(conn: PGConnection, event_id: int, player_id: int) -> None:
    """Ingest player statistics for a specific event."""
    try:
        data = api_get("/football/event/player/statistics", params={"event_id": event_id, "player_id": player_id})
        stats = data.get("success") and (data.get("data") or {}).get("statistics") or {}
        if stats:
            upsert(
                conn,
                UPSERT_PLAYER_STATISTICS,
                (
                    event_id,
                    player_id,
                    stats.get("minutesPlayed"),
                    stats.get("goals"),
                    stats.get("assists"),
                    stats.get("yellowCards"),
                    stats.get("redCards"),
                    stats.get("shots"),
                    stats.get("shotsOnTarget"),
                    stats.get("passes"),
                    stats.get("passesAccurate"),
                    stats.get("tackles"),
                    stats.get("interceptions"),
                    stats.get("fouls"),
                    stats.get("rating"),
                    psycopg2.extras.Json(stats),
                ),
            )
        commit(conn)
    except Exception as e:
        logger.debug("Player statistics fetch failed for event %s player %s: %s", event_id, player_id, e)


def ingest_team_statistics(conn: PGConnection, event_id: int) -> None:
    """Ingest team statistics for a specific event."""
    try:
        data = api_get("/football/event/statistics", params={"event_id": event_id})
        stats_data = data.get("success") and (data.get("data") or {}).get("statistics") or []
        
        # Get team IDs for this event
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            cur.execute("SELECT team_id, side FROM event_teams WHERE event_id=%s", (event_id,))
            teams = {row[1]: row[0] for row in cur.fetchall()}
        
        for stat_group in stats_data:
            group_name = stat_group.get("groupName")
            stats_items = stat_group.get("statisticsItems") or []
            
            for item in stats_items:
                home_value = item.get("homeValue")
                away_value = item.get("awayValue")
                stat_name = item.get("name")
                
                # Insert for home team
                if "home" in teams and home_value is not None:
                    upsert(
                        conn,
                        UPSERT_TEAM_STATISTICS,
                        (
                            event_id,
                            teams["home"],
                            "home",
                            group_name,
                            stat_name,
                            home_value,
                            psycopg2.extras.Json(item),
                        ),
                    )
                
                # Insert for away team
                if "away" in teams and away_value is not None:
                    upsert(
                        conn,
                        UPSERT_TEAM_STATISTICS,
                        (
                            event_id,
                            teams["away"],
                            "away",
                            group_name,
                            stat_name,
                            away_value,
                            psycopg2.extras.Json(item),
                        ),
                    )
        
        commit(conn)
    except Exception as e:
        logger.debug("Team statistics fetch failed for event %s: %s", event_id, e)


def ingest_standings(conn: PGConnection, tournament_id: int, season_id: int) -> None:
    """Ingest standings for a tournament season."""
    try:
        data = api_get("/football/tournament/standings", params={"tournament_id": tournament_id, "season_id": season_id})
        standings_data = data.get("success") and (data.get("data") or {}).get("standings") or []
        
        for standing_group in standings_data:
            group_name = standing_group.get("name")
            rows = standing_group.get("rows") or []
            
            for row in rows:
                team = row.get("team") or {}
                team_id = team.get("id")
                
                if team_id:
                    # Ensure team exists in database
                    upsert_team_from_obj(conn, team)
                    
                    upsert(
                        conn,
                        UPSERT_STANDINGS,
                        (
                            tournament_id,
                            season_id,
                            team_id,
                            group_name,
                            row.get("position"),
                            row.get("matches"),
                            row.get("wins"),
                            row.get("draws"),
                            row.get("losses"),
                            row.get("scoresFor"),
                            row.get("scoresAgainst"),
                            row.get("points"),
                            psycopg2.extras.Json(row),
                        ),
                    )
        
        commit(conn)
    except Exception as e:
        logger.debug("Standings fetch failed for tournament %s season %s: %s", tournament_id, season_id, e)


def ingest_tournament_featured_events(conn: PGConnection, tournament_id: int) -> None:
    """Ingest featured events for a tournament."""
    try:
        data = api_get("/football/tournament/featured-events", params={"tournament_id": tournament_id})
        events = data.get("success") and (data.get("data") or {}).get("events") or []
        
        for event in events:
            event_id = event.get("id")
            if event_id:
                upsert(
                    conn,
                    UPSERT_TOURNAMENT_FEATURED_EVENTS,
                    (
                        tournament_id,
                        event_id,
                        event.get("priority"),
                        event.get("featured"),
                        psycopg2.extras.Json(event),
                    ),
                )
        
        commit(conn)
    except Exception as e:
        logger.debug("Tournament featured events fetch failed for tournament %s: %s", tournament_id, e)


def ingest_tournament_videos(conn: PGConnection, tournament_id: int) -> None:
    """Ingest videos for a tournament."""
    try:
        data = api_get("/football/tournament/videos", params={"tournament_id": tournament_id})
        videos = data.get("success") and (data.get("data") or {}).get("videos") or []
        
        for video in videos:
            video_id = video.get("id")
            if video_id:
                upsert(
                    conn,
                    UPSERT_TOURNAMENT_VIDEOS,
                    (
                        tournament_id,
                        video_id,
                        video.get("title"),
                        video.get("url"),
                        video.get("thumbnail"),
                        video.get("duration"),
                        video.get("publishedAt"),
                        psycopg2.extras.Json(video),
                    ),
                )
        
        commit(conn)
    except Exception as e:
        logger.debug("Tournament videos fetch failed for tournament %s: %s", tournament_id, e)


def ingest_trending_players(conn: PGConnection) -> None:
    """Ingest trending players data."""
    try:
        data = api_get("/football/trending/players")
        players = data.get("success") and (data.get("data") or {}).get("players") or []
        
        for player_data in players:
            player = player_data.get("player") or {}
            player_id = player.get("id")
            
            if player_id:
                # Ensure player exists in database
                upsert(
                    conn,
                    UPSERT_PLAYER,
                    (
                        player_id,
                        player.get("name"),
                        player.get("slug"),
                        player.get("shortName"),
                        player.get("position"),
                        player.get("jerseyNumber"),
                        player.get("height"),
                        player.get("dateOfBirthTimestamp"),
                        (player.get("country") or {}).get("alpha2"),
                        (player.get("marketValue") or {}).get("value"),
                        psycopg2.extras.Json({"source": "trending"}),
                    ),
                )
                
                upsert(
                    conn,
                    UPSERT_TRENDING_PLAYERS,
                    (
                        player_id,
                        player_data.get("trendingRank"),
                        player_data.get("trendingScore"),
                        player_data.get("category"),
                        psycopg2.extras.Json(player_data),
                    ),
                )
        
        commit(conn)
    except Exception as e:
        logger.debug("Trending players fetch failed: %s", e)


def ingest_suggestions(conn: PGConnection, query: str = "football") -> None:
    """Ingest search suggestions data."""
    try:
        data = api_get("/search/suggestions", params={"query": query})
        suggestions = data.get("success") and (data.get("data") or {}).get("suggestions") or []
        
        for suggestion in suggestions:
            suggestion_id = suggestion.get("id")
            if suggestion_id:
                upsert(
                    conn,
                    UPSERT_SUGGESTIONS,
                    (
                        suggestion_id,
                        query,
                        suggestion.get("type"),
                        suggestion.get("name"),
                        suggestion.get("slug"),
                        suggestion.get("priority"),
                        psycopg2.extras.Json(suggestion),
                    ),
                )
        
        commit(conn)
    except Exception as e:
        logger.debug("Suggestions fetch failed for query '%s': %s", query, e)


def ingest_live_category_counts(conn: PGConnection) -> None:
    """Ingest live category counts data."""
    try:
        data = api_get("/football/live/category-counts")
        categories = data.get("success") and (data.get("data") or {}).get("categories") or []
        
        for category in categories:
            category_id = category.get("id")
            if category_id:
                upsert(
                    conn,
                    UPSERT_LIVE_CATEGORY_COUNTS,
                    (
                        category_id,
                        category.get("name"),
                        category.get("liveCount"),
                        category.get("totalCount"),
                        psycopg2.extras.Json(category),
                    ),
                )
        
        commit(conn)
    except Exception as e:
        logger.debug("Live category counts fetch failed: %s", e)


def ingest_event_count_by_sport(conn: PGConnection) -> None:
    """Ingest event count by sport data."""
    try:
        data = api_get("/football/events/count-by-sport")
        sports = data.get("success") and (data.get("data") or {}).get("sports") or []
        
        for sport in sports:
            sport_id = sport.get("id")
            if sport_id:
                upsert(
                    conn,
                    UPSERT_EVENT_COUNT_BY_SPORT,
                    (
                        sport_id,
                        sport.get("name"),
                        sport.get("eventCount"),
                        sport.get("liveEventCount"),
                        psycopg2.extras.Json(sport),
                    ),
                )
        
        commit(conn)
    except Exception as e:
        logger.debug("Event count by sport fetch failed: %s", e)


def ingest_player_images(conn: PGConnection) -> None:
    """Ingest player images with rate limiting."""
    try:
        # Get all players from database to fetch their images
        cursor = conn.cursor()
        cursor.execute("SELECT id, slug FROM players WHERE slug IS NOT NULL LIMIT 100")
        players = cursor.fetchall()
        
        for player_id, player_slug in players:
            try:
                # Add rate limiting delay
                time.sleep(IMAGE_DOWNLOAD_DELAY)
                
                data = api_get(f"/player/{player_id}/image")
                if data.get("success") and data.get("data"):
                    image_data = data["data"]
                    upsert(
                        conn,
                        UPSERT_IMAGES_PLAYER,
                        (
                            player_id,
                            image_data.get("url"),
                            image_data.get("type"),
                            image_data.get("width"),
                            image_data.get("height"),
                            image_data.get("size"),
                            psycopg2.extras.Json(image_data),
                        ),
                    )
            except Exception as e:
                logger.debug("Player image fetch failed for player %s: %s", player_id, e)
                continue
        
        commit(conn)
    except Exception as e:
        logger.debug("Player images ingestion failed: %s", e)


def ingest_team_images(conn: PGConnection) -> None:
    """Ingest team images with rate limiting."""
    try:
        # Get all teams from database to fetch their images
        cursor = conn.cursor()
        cursor.execute("SELECT id, slug FROM teams WHERE slug IS NOT NULL LIMIT 100")
        teams = cursor.fetchall()
        
        for team_id, team_slug in teams:
            try:
                # Add rate limiting delay
                time.sleep(IMAGE_DOWNLOAD_DELAY)
                
                data = api_get(f"/team/{team_id}/image")
                if data.get("success") and data.get("data"):
                    image_data = data["data"]
                    upsert(
                        conn,
                        UPSERT_IMAGES_TEAM,
                        (
                            team_id,
                            image_data.get("url"),
                            image_data.get("type"),
                            image_data.get("width"),
                            image_data.get("height"),
                            image_data.get("size"),
                            psycopg2.extras.Json(image_data),
                        ),
                    )
            except Exception as e:
                logger.debug("Team image fetch failed for team %s: %s", team_id, e)
                continue
        
        commit(conn)
    except Exception as e:
        logger.debug("Team images ingestion failed: %s", e)


def ingest_tournament_images(conn: PGConnection) -> None:
    """Ingest tournament images with rate limiting."""
    try:
        # Get all tournaments from database to fetch their images
        cursor = conn.cursor()
        cursor.execute("SELECT id, slug FROM tournaments WHERE slug IS NOT NULL LIMIT 50")
        tournaments = cursor.fetchall()
        
        for tournament_id, tournament_slug in tournaments:
            try:
                # Add rate limiting delay
                time.sleep(IMAGE_DOWNLOAD_DELAY)
                
                data = api_get(f"/tournament/{tournament_id}/image")
                if data.get("success") and data.get("data"):
                    image_data = data["data"]
                    upsert(
                        conn,
                        UPSERT_IMAGES_TOURNAMENT,
                        (
                            tournament_id,
                            image_data.get("url"),
                            image_data.get("type"),
                            image_data.get("width"),
                            image_data.get("height"),
                            image_data.get("size"),
                            psycopg2.extras.Json(image_data),
                        ),
                    )
            except Exception as e:
                logger.debug("Tournament image fetch failed for tournament %s: %s", tournament_id, e)
                continue
        
        commit(conn)
    except Exception as e:
        logger.debug("Tournament images ingestion failed: %s", e)


# ---------------
# Main flow
# ---------------

def main() -> None:
    logger.info("API base: %s", API_BASE)
    ensure_database_exists()

    with _connect(DB_NAME) as conn:
        conn.autocommit = False
        run_schema(conn)

        # Seed reference
        seed_sports(conn)

        # Ingest categories and tournaments catalog
        ingest_categories(conn)
        ingest_tournaments_catalog(conn)

        # Ingest today's scheduled events
        event_ids = ingest_scheduled_events_for_today(conn)

        # For each event, enrich and pull lineups+heatmaps+transfers for starters
        # Cap events processed to avoid long first run
        for eid in event_ids[:MAX_EVENTS]:
            enrich_event_details(conn, eid)
            starters_home, starters_away = ingest_lineups(conn, eid)

            # Heatmaps and transfers for starters (limit to avoid overload)
            for pid in starters_home[:MAX_STARTERS] + starters_away[:MAX_STARTERS]:
                if FETCH_HEATMAPS:
                    ingest_player_heatmap(conn, eid, pid)
                if FETCH_TRANSFERS:
                    ingest_player_transfers(conn, pid)
                    time.sleep(0.05)
                # Ingest player statistics for each player
                if FETCH_STATISTICS:
                    ingest_player_statistics(conn, eid, pid)
            
            # Ingest team statistics for the event (outside player loop)
            if FETCH_STATISTICS:
                ingest_team_statistics(conn, eid)
        
        # Ingest tournament-level data
        if FETCH_STANDINGS or FETCH_TOURNAMENT_FEATURES:
            # Get unique tournaments from processed events
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT t.unique_tournament_id, s.id as season_id
                FROM events e
                JOIN tournaments t ON e.tournament_id = t.id
                JOIN seasons s ON e.season_id = s.id
                WHERE t.unique_tournament_id IS NOT NULL
                LIMIT 10
            """)
            tournament_seasons = cursor.fetchall()
            
            for unique_tournament_id, season_id in tournament_seasons:
                if FETCH_STANDINGS:
                    ingest_standings(conn, unique_tournament_id, season_id)
                if FETCH_TOURNAMENT_FEATURES:
                    ingest_tournament_featured_events(conn, unique_tournament_id)
                    ingest_tournament_videos(conn, unique_tournament_id)
        
        # Ingest trending and suggestion data
        if FETCH_TRENDING:
            ingest_trending_players(conn)
        
        if FETCH_SUGGESTIONS:
            ingest_suggestions(conn, "football")
            ingest_suggestions(conn, "basketball")
            ingest_suggestions(conn, "tennis")
        
        # Ingest live counts and event counts
        if FETCH_LIVE_COUNTS:
            ingest_live_category_counts(conn)
            ingest_event_count_by_sport(conn)
        
        # Ingest images (with rate limiting)
        if FETCH_IMAGES:
            logger.info("Starting image ingestion with rate limiting...")
            ingest_player_images(conn)
            ingest_team_images(conn)
            ingest_tournament_images(conn)

    logger.info("Bootstrap completed successfully")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.warning("Interrupted by user")
        sys.exit(130)
    except Exception as exc:
        logger.exception("Fatal error: %s", exc)
        sys.exit(1)
