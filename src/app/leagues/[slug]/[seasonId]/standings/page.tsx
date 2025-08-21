import { Metadata } from 'next'
import { findTournamentBySlug, tournamentStandings } from '@/utils/snapshots'

export const revalidate = 900

export async function generateMetadata({ params }: { params: { slug: string; seasonId: string } }): Promise<Metadata> {
  return { title: `${params.slug.replace(/-/g,' ')} ${params.seasonId} Standings` }
}

export default async function Page({ params }: { params: { slug: string; seasonId: string } }) {
  const league = findTournamentBySlug(params.slug)
  if (!league) return <main className="max-w-5xl mx-auto px-4 py-6">Not found</main>
  const seasonId = Number(params.seasonId)
  const data = tournamentStandings(league.id, seasonId)
  const groups = data?.data?.standings ?? []
  return (
    <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">{league.name} — {params.seasonId} Standings</h1>
      {groups.map((g:any, i:number) => (
        <section key={i} className="rounded border border-gray-800 p-4">
          <h2 className="font-semibold mb-2">{g.name}</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400">
                <th className="py-1">#</th>
                <th className="py-1">Team</th>
                <th className="py-1">P</th>
                <th className="py-1">W</th>
                <th className="py-1">D</th>
                <th className="py-1">L</th>
                <th className="py-1">GF</th>
                <th className="py-1">GA</th>
                <th className="py-1">GD</th>
                <th className="py-1">Pts</th>
              </tr>
            </thead>
            <tbody>
              {(g.rows || []).map((r:any, j:number) => (
                <tr key={j} className="border-t border-gray-800">
                  <td className="py-1">{r.rank}</td>
                  <td className="py-1">{r.team?.name}</td>
                  <td className="py-1">{r.played}</td>
                  <td className="py-1">{r.wins}</td>
                  <td className="py-1">{r.draws}</td>
                  <td className="py-1">{r.losses}</td>
                  <td className="py-1">{r.gf}</td>
                  <td className="py-1">{r.ga}</td>
                  <td className="py-1">{r.gd}</td>
                  <td className="py-1 font-semibold">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {groups.length === 0 && <p className="text-gray-400">No standings in snapshot.</p>}
    </main>
  )
}
