"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type SeriesPoint = { t: number | Date; v: number }

type Delta = {
  label: React.ReactNode
  positive?: boolean
}

export type StatCardProps = {
  title: string
  subtitle?: React.ReactNode
  value?: React.ReactNode
  icon?: React.ReactNode
  series?: SeriesPoint[] // time-indexed values
  delta?: Delta
  loading?: boolean
  className?: string
  valueFormat?: (v: number) => React.ReactNode // optional formatter for numeric series
}

function toMillis(t: number | Date) {
  return typeof t === "number" ? t : t.getTime()
}

function Sparkline({ series }: { series: SeriesPoint[] }) {
  const path = React.useMemo(() => {
    if (!series || series.length < 2) return { d: "", viewBox: "0 0 100 28" }

    const width = 100
    const height = 28
    const padX = 2
    const padY = 4

    const times = series.map((p) => toMillis(p.t))
    const values = series.map((p) => p.v)

    const minT = Math.min(...times)
    const maxT = Math.max(...times)
    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const spanT = Math.max(1, maxT - minT)
    const spanV = Math.max(1e-6, maxV - minV)

    const x = (t: number) => padX + ((t - minT) / spanT) * (width - padX * 2)
    const y = (v: number) => padY + (height - padY * 2) * (1 - (v - minV) / spanV)

    const line = series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(toMillis(p.t)).toFixed(2)} ${y(p.v).toFixed(2)}`)
      .join(" ")

    const firstX = x(toMillis(series[0].t)).toFixed(2)
    const lastX = x(toMillis(series[series.length - 1].t)).toFixed(2)
    const baseY = (height - padY).toFixed(2)
    const area = `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`

    return { d: line, area, viewBox: `0 0 ${width} ${height}` }
  }, [series])

  if (!path.d) return <div className="h-7 w-full" aria-hidden="true" />

  return (
    <div className="h-7 w-full text-muted-foreground" aria-hidden="true">
      <svg viewBox={path.viewBox} width="100%" height="100%" preserveAspectRatio="none">
        <path d={path.area!} fill="currentColor" opacity="0.08" />
        <path d={path.d} fill="none" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      </svg>
    </div>
  )
}

export function StatCard({
  title,
  subtitle,
  value,
  icon,
  series,
  delta,
  loading = false,
  className,
  valueFormat,
}: StatCardProps) {
  // Derive the value from the last series point if not explicitly provided
  const derivedValue = React.useMemo(() => {
    if (value !== undefined) return value
    if (!series?.length) return undefined
    const last = series[series.length - 1].v
    return valueFormat ? valueFormat(last) : last
  }, [value, series, valueFormat])

  return (
    <Card className={cn("h-full min-w-0", className)}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium truncate">{title}</CardTitle>
          {icon ? <div className="shrink-0 rounded-md bg-muted p-1.5 text-muted-foreground">{icon}</div> : null}
        </div>
        {subtitle ? <p className="text-xs leading-relaxed text-muted-foreground">{subtitle}</p> : null}
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-2xl font-semibold tabular-nums truncate" aria-live="polite" aria-atomic="true">
            {loading ? <span className="inline-block h-7 w-20 animate-pulse rounded bg-muted" /> : derivedValue}
          </div>
          {delta ? (
            <span
              className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                delta.positive === undefined
                  ? "bg-muted text-muted-foreground"
                  : delta.positive
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
              )}
              title={typeof delta.label === "string" ? delta.label : undefined}
            >
              {delta.label}
            </span>
          ) : null}
        </div>

        {series && series.length > 1 ? <Sparkline series={series} /> : null}
      </CardContent>
    </Card>
  )
}
