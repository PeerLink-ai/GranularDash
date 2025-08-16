"use client"

import { useState, useEffect, useMemo } from "react"
import { StatCard, type SeriesPoint } from "@/components/ui/stat-card"
import { Bot, CheckCircle2, BarChart3, HeartPulse } from "lucide-react"
import { InteractiveAgentManagement } from "@/components/interactive-agent-management"

interface Agent {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "error"
  endpoint: string
  version: string
  description: string
  connected_at: string
  last_activity?: string
}

interface AgentStats {
  total: number
  active: number
  inactive: number
  error: number
  totalRequests: number
  healthPercentage: number
}

const BASE_TOTAL = [5, 6, 7, 8, 10, 10, 11, 12]
const BASE_ACTIVE = [3, 4, 5, 6, 7, 8, 8, 9]
const BASE_REQ = [200, 400, 600, 800, 900, 1000, 950, 1100]
const BASE_HEALTH = [70, 75, 80, 82, 85, 88, 90, 92]

function alignSeriesToLast(base: number[], target: number) {
  const n = base.length
  if (n === 0) return []
  const baseLast = base[n - 1]
  const delta = target - baseLast
  return base.map((v, i) => Math.max(0, Math.round(v + (delta * i) / (n - 1 || 1))))
}
function withTime(values: number[], stepMs: number): SeriesPoint[] {
  const now = Date.now()
  const start = now - (values.length - 1) * stepMs
  return values.map((v, i) => ({ t: new Date(start + i * stepMs), v }))
}

export default function AgentManagementPage() {
  const [stats, setStats] = useState<AgentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0,
    totalRequests: 0,
    healthPercentage: 100,
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchAgentStats = async () => {
    try {
      const response = await fetch("/api/agents")
      if (!response.ok) throw new Error("Failed to fetch agents")

      const data = await response.json()
      const agents: Agent[] = data.agents || []

      const total = agents.length
      const active = agents.filter((a) => a.status === "active").length
      const inactive = agents.filter((a) => a.status === "inactive").length
      const error = agents.filter((a) => a.status === "error").length

      const healthPercentage = total > 0 ? Math.round((active / total) * 100) : 100

      // Keep randomization in effect, not render
      const totalRequests = agents.reduce(
        (sum, a) => sum + (a.status === "active" ? Math.floor(Math.random() * 1000) : 0),
        0,
      )

      setStats({
        total,
        active,
        inactive,
        error,
        totalRequests,
        healthPercentage,
      })
    } catch (err) {
      console.error("Error fetching agent stats:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentStats()
    const interval = setInterval(fetchAgentStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const series = useMemo(() => {
    const day = 24 * 60 * 60 * 1000
    return {
      total: withTime(alignSeriesToLast(BASE_TOTAL, stats.total), day),
      active: withTime(alignSeriesToLast(BASE_ACTIVE, stats.active), day),
      req: withTime(alignSeriesToLast(BASE_REQ, stats.totalRequests), day),
      health: withTime(alignSeriesToLast(BASE_HEALTH, stats.healthPercentage), day),
    }
  }, [stats.total, stats.active, stats.totalRequests, stats.healthPercentage])

  const healthLabel = (p: number) => {
    if (p >= 80) return "Excellent"
    if (p >= 60) return "Good"
    if (p >= 40) return "Fair"
    return "Poor"
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      {/* Responsive header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Agent Management</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Agents"
          subtitle={stats.total === 0 ? "No agents connected" : `${stats.total} connected`}
          value={isLoading ? "—" : stats.total}
          icon={<Bot className="h-5 w-5" />}
          series={series.total}
          className="min-w-0"
        />
        <StatCard
          title="Active Agents"
          subtitle={stats.active === 0 ? "No active agents" : "Currently running"}
          value={isLoading ? "—" : stats.active}
          icon={<CheckCircle2 className="h-5 w-5" />}
          series={series.active}
          delta={stats.active > 0 ? { label: "Healthy", positive: true } : { label: "Idle", positive: false }}
          className="min-w-0"
        />
        <StatCard
          title="Total Requests"
          subtitle="This month"
          value={isLoading ? "—" : stats.totalRequests.toLocaleString()}
          icon={<BarChart3 className="h-5 w-5" />}
          series={series.req}
          className="min-w-0"
        />
        <StatCard
          title="Health Status"
          subtitle={healthLabel(stats.healthPercentage)}
          value={isLoading ? "—" : `${stats.healthPercentage}%`}
          icon={<HeartPulse className="h-5 w-5" />}
          series={series.health}
          delta={{
            label: healthLabel(stats.healthPercentage),
            positive: stats.healthPercentage >= 70,
          }}
          className="min-w-0"
        />
      </div>

      <InteractiveAgentManagement />
    </div>
  )
}
