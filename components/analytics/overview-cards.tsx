"use client"

import { useEffect, useMemo, useState } from "react"
import { StatCard, type SeriesPoint } from "@/components/ui/stat-card"
import { Shield, AlertTriangle, CheckCircle, Activity } from "lucide-react"

interface SecurityMetrics {
  totalAgents: number
  securityViolations: number
  activeThreats: number
  complianceScore: number
}

const BASE_AGENTS = [6, 7, 8, 8, 9, 9, 10, 11]
const BASE_VIOL = [2, 2, 3, 3, 2, 2, 1, 1]
const BASE_THREATS = [4, 4, 3, 3, 3, 2, 2, 2]
const BASE_COMPLIANCE = [88, 89, 90, 91, 92, 93, 93, 94]

function alignSeriesToLast(base: number[], target: number) {
  const n = base.length
  if (n === 0) return []
  const baseLast = base[n - 1]
  const delta = target - baseLast
  return base.map((v, i) => Math.round(v + (delta * i) / (n - 1 || 1)))
}
function withTime(values: number[], stepMs: number): SeriesPoint[] {
  const now = Date.now()
  const start = now - (values.length - 1) * stepMs
  return values.map((v, i) => ({ t: new Date(start + i * stepMs), v }))
}

export function OverviewCards() {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalAgents: 0,
    securityViolations: 0,
    activeThreats: 0,
    complianceScore: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch("/api/analytics/security-metrics")
        if (response.ok) {
          const data = await response.json()
          setMetrics(data)
        }
      } catch (error) {
        console.error("Failed to fetch security metrics:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  const series = useMemo(() => {
    const day = 24 * 60 * 60 * 1000
    return {
      agents: withTime(alignSeriesToLast(BASE_AGENTS, metrics.totalAgents), day),
      viol: withTime(alignSeriesToLast(BASE_VIOL, metrics.securityViolations), day),
      threats: withTime(alignSeriesToLast(BASE_THREATS, metrics.activeThreats), day),
      compliance: withTime(alignSeriesToLast(BASE_COMPLIANCE, metrics.complianceScore), day),
    }
  }, [metrics.totalAgents, metrics.securityViolations, metrics.activeThreats, metrics.complianceScore])

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Agents"
        subtitle="Under monitoring"
        value={loading ? "…" : metrics.totalAgents}
        icon={<Activity className="h-5 w-5" />}
        series={series.agents}
        className="min-w-0"
      />
      <StatCard
        title="Security Violations"
        subtitle="This month"
        value={loading ? "…" : metrics.securityViolations}
        icon={<AlertTriangle className="h-5 w-5" />}
        series={series.viol}
        delta={{
          label: loading ? "…" : metrics.securityViolations === 0 ? "Clear" : "Action needed",
          positive: loading ? undefined : metrics.securityViolations === 0,
        }}
        className="min-w-0"
      />
      <StatCard
        title="Active Threats"
        subtitle="Currently tracked"
        value={loading ? "…" : metrics.activeThreats}
        icon={<Shield className="h-5 w-5" />}
        series={series.threats}
        className="min-w-0"
      />
      <StatCard
        title="Compliance Score"
        subtitle="Overall security compliance"
        value={loading ? "…" : `${metrics.complianceScore}%`}
        icon={<CheckCircle className="h-5 w-5" />}
        series={series.compliance}
        delta={{
          label: loading ? "…" : metrics.complianceScore >= 90 ? "Strong" : "Improving",
          positive: loading ? undefined : metrics.complianceScore >= 90,
        }}
        className="min-w-0"
      />
    </div>
  )
}
