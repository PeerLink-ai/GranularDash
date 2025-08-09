"use client"

import { useEffect, useMemo, useState } from "react"
import { Bot, CheckCircle2, PauseCircle, AlertTriangle } from 'lucide-react'
import { InfoStatCard } from "@/components/ui/info-stat-card"

// Stable trends to avoid re-creation on every render
const TREND_TOTAL = [4, 6, 5, 7, 9, 10, 9, 8, 9, 11, 12, 13]
const TREND_ACTIVE = [3, 5, 4, 6, 8, 9, 8, 7, 8, 10, 11, 11]
const TREND_INACTIVE = [2, 2, 3, 3, 3, 2, 3, 4, 3, 3, 2, 2]
const TREND_ERRORS = [0, 1, 0, 2, 1, 1, 0, 1, 1, 0, 1, 0]

type Agent = {
  id: string
  name: string
  status: "active" | "inactive" | "error" | string
  connected_at: string
  last_activity?: string
}

export default function MetricsSummary() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/agents")
        if (!res.ok) throw new Error("Failed to fetch agents")
        const data = await res.json()
        if (!cancelled) setAgents(Array.isArray(data.agents) ? data.agents : [])
      } catch {
        if (!cancelled) setAgents([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const totals = useMemo(() => {
    const total = agents.length
    const active = agents.filter((a) => a.status === "active").length
    const inactive = agents.filter((a) => a.status === "inactive").length
    const error = agents.filter((a) => a.status === "error").length
    const uptime = total > 0 ? Math.round((active / total) * 100) : 0
    return { total, active, inactive, error, uptime }
  }, [agents])

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <InfoStatCard
        title="Total Agents"
        value={loading ? "—" : totals.total}
        deltaLabel={loading ? undefined : `${totals.uptime}% uptime`}
        icon={<Bot className="h-5 w-5" />}
        loading={loading}
        variant="neutral"
        trend={TREND_TOTAL}
      />
      <InfoStatCard
        title="Active"
        value={loading ? "—" : totals.active}
        deltaLabel={loading ? undefined : "Healthy"}
        icon={<CheckCircle2 className="h-5 w-5" />}
        loading={loading}
        variant="success"
        trend={TREND_ACTIVE}
      />
      <InfoStatCard
        title="Inactive"
        value={loading ? "—" : totals.inactive}
        deltaLabel={loading ? undefined : "Paused / Idle"}
        icon={<PauseCircle className="h-5 w-5" />}
        loading={loading}
        variant="warning"
        trend={TREND_INACTIVE}
      />
      <InfoStatCard
        title="Errors"
        value={loading ? "—" : totals.error}
        deltaLabel={
          loading ? undefined : totals.error > 0 ? "Attention needed" : "All clear"
        }
        icon={<AlertTriangle className="h-5 w-5" />}
        loading={loading}
        variant="danger"
        trend={TREND_ERRORS}
      />
    </div>
  )
}
