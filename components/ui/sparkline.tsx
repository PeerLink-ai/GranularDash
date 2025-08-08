"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

interface SparklineProps {
  data?: number[]
  width?: number
  height?: number
  strokeClassName?: string
  fillClassName?: string
  className?: string
}

export function Sparkline({
  data = [2, 5, 3, 7, 4, 8, 6, 9],
  width = 120,
  height = 36,
  strokeClassName = "stroke-primary",
  fillClassName = "fill-primary/10",
  className,
}: SparklineProps) {
  const { points, min, max } = useMemo(() => {
    const minVal = Math.min(...data)
    const maxVal = Math.max(...data)
    const range = maxVal - minVal || 1
    const stepX = width / Math.max(data.length - 1, 1)
    const pts = data.map((v, i) => {
      const x = i * stepX
      const y = height - ((v - minVal) / range) * height
      return [x, y]
    })
    return { points: pts, min: minVal, max: maxVal }
  }, [data, width, height])

  const path = useMemo(() => {
    if (points.length === 0) return ""
    return points.map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`)).join(" ")
  }, [points])

  const areaPath = useMemo(() => {
    if (points.length === 0) return ""
    const start = `M ${points[0][0]},${height}`
    const line = points.map(([x, y]) => `L ${x},${y}`).join(" ")
    const end = `L ${points[points.length - 1][0]},${height} Z`
    return `${start} ${line} ${end}`
  }, [points, height])

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
      aria-label={`Sparkline from ${min} to ${max}`}
      role="img"
    >
      <path d={areaPath} className={fillClassName} />
      <path d={path} className={cn("fill-none", strokeClassName)} strokeWidth={2} />
    </svg>
  )
}
