#!/usr/bin/env tsx

import fs from 'node:fs'
import path from 'node:path'
import { db } from '../db/client.js'
import { sql } from 'drizzle-orm'

/**
 * Script to populate trending_players table from JSON snapshot data
 */

function getLatestSnapshotRoot(): string | null {
  const snapshotRoot = path.join(process.cwd(), 'data', 'api_snapshots')
  
  try {
    const entries = fs.readdirSync(snapshotRoot, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name)
      .sort()
    
    if (!entries.length) return null
    return path.join(snapshotRoot, entries[entries.length - 1])
  } catch {
    return null
  }
}

function loadSnapshotJson(relPath: string): any | null {
  const root = getLatestSnapshotRoot()
  if (!root) return null
  
  const fullPath = path.join(root, relPath)
  if (!fs.existsSync(fullPath)) return null
  
  try {
    const raw = fs.readFileSync(fullPath, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function populateTrendingPlayers() {
  console.log('🚀 Starting trending players population...')
  
  // Load trending players from snapshot
  const trendingData = loadSnapshotJson('trending/players.json')
  
  if (!trendingData?.success || !trendingData?.data?.topPlayers) {
    console.error('❌ No trending players data found in snapshots')
    return
  }
  
  const topPlayers = trendingData.data.topPlayers
  console.log(`📊 Found ${topPlayers.length} trending players in snapshot`)
  
  let playersUpserted = 0
  let trendingRecordsUpserted = 0
  
  for (const item of topPlayers) {
    try {
      const player = item.player
      const event = item.event
      
      if (!player?.id || !event?.id) {
        console.warn('⚠️  Skipping item with missing player or event ID')
        continue
      }
      
      // Extract player data
      const playerId = player.id
      const playerName = player.name
      const playerSlug = player.slug
      const shortName = player.shortName || player.firstName
      const position = player.position
      const jerseyNumber = player.jerseyNumber
      const height = player.height
      const dateOfBirthTimestamp = player.dateOfBirthTimestamp
      const countryAlpha2 = player.country?.alpha2 || null
      const marketValueEur = player.proposedMarketValueRaw?.value || player.marketValue?.value || null
      
      // Upsert player
      await db.execute(sql`
        INSERT INTO players (id, name, slug, short_name, position, jersey_number, height, date_of_birth_ts, country_alpha2, market_value_eur, extra)
        VALUES (${playerId}, ${playerName}, ${playerSlug}, ${shortName}, ${position}, ${jerseyNumber}, ${height}, ${dateOfBirthTimestamp}, ${countryAlpha2}, ${marketValueEur}, ${JSON.stringify({ source: 'trending_snapshot', snapshotPath: 'trending/players.json' })})
        ON CONFLICT (id) DO UPDATE SET 
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          short_name = EXCLUDED.short_name,
          position = EXCLUDED.position,
          jersey_number = EXCLUDED.jersey_number,
          height = EXCLUDED.height,
          date_of_birth_ts = EXCLUDED.date_of_birth_ts,
          country_alpha2 = EXCLUDED.country_alpha2,
          market_value_eur = EXCLUDED.market_value_eur,
          extra = EXCLUDED.extra
      `)
      
      playersUpserted++
      
      // Extract rating from ratingVersions (prefer original, fallback to alternative)
      const rating = item.ratingVersions?.original || item.ratingVersions?.alternative || item.rating || null
      
      // Upsert trending player record
      await db.execute(sql`
        INSERT INTO trending_players (player_id, event_id, rating, payload)
        VALUES (${playerId}, ${event.id}, ${rating}, ${JSON.stringify({
          keyPass: item.keyPass,
          ratingVersions: item.ratingVersions,
          event: {
            id: event.id,
            tournament: event.tournament?.name,
            tournamentSlug: event.tournament?.slug
          },
          player: {
            name: playerName,
            position: position,
            jerseyNumber: jerseyNumber
          }
        })})
        ON CONFLICT (player_id, event_id) DO UPDATE SET 
          rating = EXCLUDED.rating,
          payload = EXCLUDED.payload
      `)
      
      trendingRecordsUpserted++
      
      console.log(`✅ Processed: ${playerName} (ID: ${playerId}) - Rating: ${rating}`)
      
    } catch (error) {
      console.error(`❌ Error processing player:`, error)
    }
  }
  
  console.log(`🎉 Population completed!`)
  console.log(`   📝 Players upserted: ${playersUpserted}`)
  console.log(`   ⭐ Trending records upserted: ${trendingRecordsUpserted}`)
}

async function main() {
  try {
    await populateTrendingPlayers()
    console.log('✨ Script completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { populateTrendingPlayers }
