"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkline } from "./sparkline"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface KPIProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  tone?: "emerald" | "amber" | "sky" | "rose" | "violet" | "zinc"
  trendData?: number[]
  trendLabel?: string
  className?: string
}

const toneMap = {
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950",
    icon: "text-emerald-600 dark:text-emerald-300",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200",
    stroke: "stroke-emerald-600 dark:stroke-emerald-300",
    fill: "fill-emerald-500/15",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950",
    icon: "text-amber-600 dark:text-amber-300",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
    stroke: "stroke-amber-600 dark:stroke-amber-300",
    fill: "fill-amber-500/15",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950",
    icon: "text-sky-600 dark:text-sky-300",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
    stroke: "stroke-sky-600 dark:stroke-sky-300",
    fill: "fill-sky-500/15",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950",
    icon: "text-rose-600 dark:text-rose-300",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
    stroke: "stroke-rose-600 dark:stroke-rose-300",
    fill: "fill-rose-500/15",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950",
    icon: "text-violet-600 dark:text-violet-300",
    chip: "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200",
    stroke: "stroke-violet-600 dark:stroke-violet-300",
    fill: "fill-violet-500/15",
  },
  zinc: {
    bg: "bg-zinc-50 dark:bg-zinc-900",
    icon: "text-zinc-600 dark:text-zinc-300",
    chip: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    stroke: "stroke-zinc-500 dark:stroke-zinc-300",
    fill: "fill-zinc-500/15",
  },
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "zinc",
  trendData,
  trendLabel,
  className,
}: KPIProps) {
  const toneCls = toneMap[tone]
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("h-8 w-8 rounded-lg grid place-items-center", toneCls.bg)}>
          <Icon className={cn("h-4 w-4", toneCls.icon)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-2xl font-bold leading-none">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          {trendData && (
            <Sparkline
              data={trendData}
              width={130}
              height={40}
              strokeClassName={toneCls.stroke}
              fillClassName={toneCls.fill}
            />
          )}
        </div>
        {trendLabel && (
          <div className="mt-3">
            <Badge className={cn("text-[10px] font-medium", toneCls.chip)}>{trendLabel}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
