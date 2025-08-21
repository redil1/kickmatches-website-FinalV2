"use client"
import React from 'react'

// Very small 12x8 grid heatmap for quick visualization
export default function HeatmapMini({ points, width=120, height=80 }: { points: Array<{x:number;y:number}>|undefined; width?: number; height?: number }) {
  const cols = 12
  const rows = 8
  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0))
  if (Array.isArray(points)) {
    for (const p of points) {
      // normalize assuming x,y are 0..100
      const cx = Math.max(0, Math.min(cols-1, Math.floor((p.x ?? 0) / (100/cols))))
      const cy = Math.max(0, Math.min(rows-1, Math.floor((p.y ?? 0) / (100/rows))))
      grid[cy][cx]++
    }
  }
  const max = grid.flat().reduce((m, v) => Math.max(m, v), 0) || 1
  const cellW = width / cols
  const cellH = height / rows

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="rounded border border-gray-800 bg-black/30">
      {grid.map((row, y) => row.map((v, x) => {
        const intensity = v / max
        const color = `rgba(16, 185, 129, ${0.15 + 0.6*intensity})` // emerald with alpha
        return <rect key={`${x}-${y}`} x={x*cellW} y={y*cellH} width={cellW} height={cellH} fill={color} />
      }))}
    </svg>
  )
}
