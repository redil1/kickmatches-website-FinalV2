import { Metadata } from 'next'
import { db } from '../../../db/client'
import { sql } from 'drizzle-orm'
import { slugify } from '../../../utils/slug'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Trending Football Players Today',
  description: 'See who is trending right now with ratings, events and quick links to profiles.'
}

async function getTrendingPlayers() {
  try {
    console.log('Attempting to fetch trending players from database...')
    const result = await db.execute(sql`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.position,
        p.jersey_number,
        tp.rating,
        tp.event_id,
        tp.payload
      FROM trending_players tp
      JOIN players p ON tp.player_id = p.id
      ORDER BY tp.rating DESC
      LIMIT 50
    `)
    
    console.log('Database query successful, got', result.rows.length, 'rows')
    return result.rows
  } catch (error) {
    console.error('Error fetching trending players from database:', error)
    console.error('Error details:', error instanceof Error ? error.stack : String(error))
    return []
  }
}

export default async function Page() {
  const players = await getTrendingPlayers()

  // Debug logging (will show in server logs)
  console.log('Trending Players Debug:')
  console.log('- Players count from database:', players.length)

  return (
    <main className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Trending Players</h1>
      <ul className="grid md:grid-cols-2 gap-3">
        {players.length === 0 && (
          <li className="text-gray-400">No trending players found in the database.</li>
        )}
        {players.map((player: any, idx: number) => {
          const id = player.id
          const name = player.name
          const slug = player.slug || slugify(name || String(id))
          const rating = player.rating
          const eventId = player.event_id
          const position = player.position
          const jerseyNumber = player.jersey_number
          
          return (
            <li key={idx} className="rounded border border-gray-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <a className="font-semibold hover:underline" href={`/players/${slug}-${id}`}>
                    {name || `Player #${id}`}
                  </a>
                  {position && <div className="text-xs text-gray-500">Position: {position}{jerseyNumber && ` • #${jerseyNumber}`}</div>}
                  {eventId && <div className="text-xs text-gray-400">Current event: <a className="hover:underline" href={`/m/${eventId}-${slug}`}>#{eventId}</a></div>}
                </div>
                {rating != null && (
                  <span className="text-sm px-2 py-1 rounded bg-gray-800">
                    ⭐ {Number(rating).toFixed(1)}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </main>
  )
}
