import { notFound } from 'next/navigation'
import HeatmapMini from '@/components/HeatmapMini'
import { playerHeatmap } from '@/utils/snapshots'

export const revalidate = 3600

export default function PlayerHeatmapPage({ params }: { params: { id: string; eventId: string } }) {
  const pid = Number(params.id)
  const eid = Number(params.eventId)
  if (!Number.isFinite(pid) || !Number.isFinite(eid)) return notFound()

  const data = playerHeatmap(eid, pid)
  const cells: Array<{ x: number; y: number; v: number }> = data?.data?.cells || []
  if (!cells || cells.length === 0) return (
    <div className="max-w-xl mx-auto p-6 text-center text-gray-300">No heatmap available.</div>
  )

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold text-white">Player {pid} Heatmap — Match {eid}</h1>
  <HeatmapMini points={cells.map(c => ({ x: c.x, y: c.y }))} width={420} height={280} />
    </div>
  )
}
