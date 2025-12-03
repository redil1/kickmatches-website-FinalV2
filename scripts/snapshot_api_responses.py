#!/usr/bin/env python3
"""
Snapshot API responses for all SofaScore-like endpoints referenced in
bootstrap_sofascore_db.py and save them as JSON files for future reference.

What this script does
- Calls a curated set of endpoints (categories, tournaments, scheduled events, event details, lineups,
  event/team/player statistics, standings, featured events, videos, trending players, search suggestions,
  live category counts, and count by sport).
- Traverses relationships to collect representative IDs (event, team, tournament, season, player).
- Writes pretty-printed JSON responses under data/api_snapshots/<timestamp>/.
- Produces an index file mapping endpoint -> saved files and entity IDs used.

Configuration via environment variables
- API_BASE (default: http://69.197.168.221:8004)
- REQUEST_TIMEOUT (default: 20)
- MAX_EVENTS (default: 6)
- MAX_PLAYERS_PER_EVENT (default: 6)
- QUERIES (default: football,basketball,tennis)
- SLEEP_SECONDS (default: 0.2) — small delay between calls

Safe to run repeatedly; each run creates a new timestamped snapshot folder.
"""
from __future__ import annotations

import os
import sys
import time
import json
import pathlib
import traceback
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple, Set

import requests

# -----------------
# Config
# -----------------
API_BASE = os.environ.get("API_BASE", "http://155.117.46.251:8004").rstrip("/")
REQUEST_TIMEOUT = int(os.environ.get("REQUEST_TIMEOUT", "20"))
MAX_EVENTS = int(os.environ.get("MAX_EVENTS", "6"))
MAX_PLAYERS_PER_EVENT = int(os.environ.get("MAX_PLAYERS_PER_EVENT", "6"))
SLEEP_SECONDS = float(os.environ.get("SLEEP_SECONDS", "0.2"))
QUERIES = [q.strip() for q in os.environ.get("QUERIES", "football,basketball,tennis").split(",") if q.strip()]

RUN_TS = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
OUT_ROOT = pathlib.Path(__file__).resolve().parents[1] / "data" / "api_snapshots" / RUN_TS
META_DIR = OUT_ROOT / "_meta"

# Track where we saved what
INDEX: Dict[str, Any] = {
    "api_base": API_BASE,
    "run_ts": RUN_TS,
    "endpoints": {},
    "entities": {
        "events": [],
        "players": [],
        "tournaments": [],
        "seasons": [],
    },
}


def _ensure_dirs() -> None:
    META_DIR.mkdir(parents=True, exist_ok=True)


def _save_json(rel_path: str, payload: Any) -> str:
    """Save JSON under OUT_ROOT and return the absolute path as string."""
    path = OUT_ROOT / rel_path
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    return str(path)


def _record(endpoint: str, saved_file: str, note: Optional[str] = None) -> None:
    endpoints = INDEX.setdefault("endpoints", {})
    arr = endpoints.setdefault(endpoint, [])
    entry = {"file": os.path.relpath(saved_file, OUT_ROOT), "note": note}
    arr.append(entry)


def _get(path: str, params: Optional[Dict[str, Any]] = None) -> Any:
    url = f"{API_BASE}{path}"
    try:
        r = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        try:
            return r.json()
        except Exception:
            return {"raw": r.text}
    except Exception as e:
        return {"error": str(e), "trace": traceback.format_exc(), "url": url, "params": params}
    finally:
        if SLEEP_SECONDS:
            time.sleep(SLEEP_SECONDS)


# -----------------
# Fetchers
# -----------------

def fetch_categories() -> None:
    data = _get("/football/categories")
    p = _save_json("categories.json", data)
    _record("/football/categories", p)


def fetch_tournaments() -> None:
    data = _get("/football/tournaments")
    p = _save_json("tournaments.json", data)
    _record("/football/tournaments", p)


def fetch_scheduled_events(date_iso: Optional[str] = None) -> List[Dict[str, Any]]:
    if not date_iso:
        date_iso = datetime.now(timezone.utc).date().isoformat()
    data = _get("/football/events/scheduled", params={"date": date_iso})
    p = _save_json(f"events/scheduled_{date_iso}.json", data)
    _record("/football/events/scheduled", p, note=f"date={date_iso}")
    events = []
    try:
        if data.get("success"):
            events = (data.get("data") or {}).get("events", []) or []
    except Exception:
        pass
    return events


def fetch_event_bundle(event_id: int) -> Dict[str, Any]:
    bundle: Dict[str, Any] = {}

    details = _get("/football/event/details", params={"event_id": event_id})
    p = _save_json(f"events/{event_id}/details.json", details)
    _record("/football/event/details", p, note=f"event_id={event_id}")
    bundle["details"] = details

    lineups = _get("/football/event/lineups", params={"event_id": event_id})
    p = _save_json(f"events/{event_id}/lineups.json", lineups)
    _record("/football/event/lineups", p, note=f"event_id={event_id}")
    bundle["lineups"] = lineups

    statistics = _get("/football/event/statistics", params={"event_id": event_id})
    p = _save_json(f"events/{event_id}/statistics.json", statistics)
    _record("/football/event/statistics", p, note=f"event_id={event_id}")
    bundle["statistics"] = statistics

    return bundle


def _extract_players_from_lineups(lineups: Dict[str, Any]) -> List[int]:
    player_ids: List[int] = []
    try:
        for side_key in ("home_team", "away_team"):
            team = (lineups.get("data") or {}).get(side_key) or {}
            for key in ("starting_eleven", "substitutes"):
                for p in team.get(key, []) or []:
                    pid = p.get("player_id") or p.get("id")
                    if pid:
                        player_ids.append(int(pid))
    except Exception:
        pass
    # stable order, max limit
    seen: Set[int] = set()
    uniq: List[int] = []
    for pid in player_ids:
        if pid not in seen:
            seen.add(pid)
            uniq.append(pid)
    return uniq[:MAX_PLAYERS_PER_EVENT]


def fetch_player_event_bundle(event_id: int, player_id: int) -> None:
    heatmap = _get("/football/player/heatmap", params={"event_id": event_id, "player_id": player_id})
    p = _save_json(f"events/{event_id}/players/{player_id}/heatmap.json", heatmap)
    _record("/football/player/heatmap", p, note=f"event_id={event_id},player_id={player_id}")

    pstats = _get("/football/event/player/statistics", params={"event_id": event_id, "player_id": player_id})
    p2 = _save_json(f"events/{event_id}/players/{player_id}/statistics.json", pstats)
    _record("/football/event/player/statistics", p2, note=f"event_id={event_id},player_id={player_id}")

    transfers = _get("/football/player/transfer-history", params={"player_id": player_id})
    p3 = _save_json(f"players/{player_id}/transfer_history.json", transfers)
    _record("/football/player/transfer-history", p3, note=f"player_id={player_id}")


def fetch_tournament_bundle(tournament_id: int, season_id: Optional[int]) -> None:
    if season_id:
        standings = _get("/football/tournament/standings", params={"tournament_id": tournament_id, "season_id": season_id})
        p = _save_json(f"tournaments/{tournament_id}/seasons/{season_id}/standings.json", standings)
        _record("/football/tournament/standings", p, note=f"tournament_id={tournament_id},season_id={season_id}")

    featured = _get("/football/tournament/featured-events", params={"tournament_id": tournament_id})
    p2 = _save_json(f"tournaments/{tournament_id}/featured_events.json", featured)
    _record("/football/tournament/featured-events", p2, note=f"tournament_id={tournament_id}")

    videos = _get("/football/tournament/videos", params={"tournament_id": tournament_id})
    p3 = _save_json(f"tournaments/{tournament_id}/videos.json", videos)
    _record("/football/tournament/videos", p3, note=f"tournament_id={tournament_id}")


def fetch_trending_and_suggestions() -> None:
    trending = _get("/football/trending/players")
    p = _save_json("trending/players.json", trending)
    _record("/football/trending/players", p)

    for q in QUERIES:
        s = _get("/search/suggestions", params={"query": q})
        p2 = _save_json(f"search/suggestions_{q}.json", s)
        _record("/search/suggestions", p2, note=f"query={q}")


def fetch_counts() -> None:
    live = _get("/football/live/category-counts")
    p = _save_json("live/category_counts.json", live)
    _record("/football/live/category-counts", p)

    bysport = _get("/football/events/count-by-sport")
    p2 = _save_json("events/count_by_sport.json", bysport)
    _record("/football/events/count-by-sport", p2)


# -----------------
# Orchestrator
# -----------------

def main() -> None:
    print(f"API_BASE={API_BASE}")
    _ensure_dirs()

    # Top-level catalogs
    fetch_categories()
    fetch_tournaments()

    # Events of today
    today = datetime.now(timezone.utc).date().isoformat()
    events = fetch_scheduled_events(today)

    # Select a small cohort to explore deeply
    selected = []
    for e in events:
        try:
            eid = int(e.get("id"))
        except Exception:
            continue
        selected.append(e)
        if len(selected) >= MAX_EVENTS:
            break

    # Traverse events
    for e in selected:
        eid = int(e.get("id"))
        INDEX["entities"]["events"].append(eid)

        bundle = fetch_event_bundle(eid)
        # derive ids for tournament and season
        t_id = None
        s_id = None
        try:
            t_id = ((bundle.get("details") or {}).get("data") or {}).get("event", {}).get("tournament", {}).get("id")
            s_id = ((bundle.get("details") or {}).get("data") or {}).get("event", {}).get("season", {}).get("id")
        except Exception:
            pass
        if t_id:
            try:
                INDEX["entities"]["tournaments"].append(int(t_id))
            except Exception:
                pass
        if s_id:
            try:
                INDEX["entities"]["seasons"].append(int(s_id))
            except Exception:
                pass

        # Players from lineups
        players = _extract_players_from_lineups(bundle.get("lineups") or {})
        for pid in players:
            INDEX["entities"]["players"].append(pid)
            fetch_player_event_bundle(eid, pid)

        # Tournament-level
        if t_id:
            fetch_tournament_bundle(int(t_id), int(s_id) if s_id else None)

    # Other aggregates
    fetch_trending_and_suggestions()
    fetch_counts()

    # Deduplicate entity lists
    for key in ("events", "players", "tournaments", "seasons"):
        seen: Set[int] = set()
        uniq: List[int] = []
        for v in INDEX["entities"][key]:
            if v not in seen:
                seen.add(v)
                uniq.append(v)
        INDEX["entities"][key] = uniq

    # Save index
    idx_path = _save_json("_meta/index.json", INDEX)
    print(f"Snapshot complete. Root: {OUT_ROOT}\nIndex: {idx_path}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted", file=sys.stderr)
        sys.exit(130)
    except Exception as exc:
        print("Fatal error:", exc, file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
