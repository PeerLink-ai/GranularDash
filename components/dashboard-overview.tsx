"use client"

import { useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { StatCard, type SeriesPoint } from "@/components/ui/stat-card"
import { ConnectedAgentsOverview } from "@/components/connected-agents-overview"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Bot, Shield, AlertTriangle, CheckCircle } from "lucide-react"

// Base shapes kept stable to avoid re-render churn; they are aligned to current values.
const BASE_CONNECTED = [4, 5, 6, 7, 8, 9, 9, 10]
const BASE_PERMS = [2, 3, 3, 4, 4, 5, 5, 6]
const BASE_ALERTS = [1, 1, 0, 0, 0, 0, 0, 0]

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

export function DashboardOverview() {
  const { user } = useAuth()
  const hasConnectedAgents = user ? user.connectedAgents.length > 0 : false

  const series = useMemo(() => {
    const day = 24 * 60 * 60 * 1000
    const connected = user ? withTime(alignSeriesToLast(BASE_CONNECTED, user.connectedAgents.length), day) : []
    const perms = user ? withTime(alignSeriesToLast(BASE_PERMS, user.permissions.length), day) : []
    const alerts = withTime(alignSeriesToLast(BASE_ALERTS, 0), day)
    return { connected, perms, alerts }
  }, [user])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
      case "developer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
      case "analyst":
        return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
      case "viewer":
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700/60 dark:text-gray-200"
    }
  }

  const getWelcomeMessage = () => {
    if (!user) return "Welcome to your AI governance dashboard."
    switch (user.role) {
      case "admin":
        return "You have full administrative access to all AI governance features."
      case "developer":
        return "Manage and test your connected AI agents with development tools."
      case "analyst":
        return "Access analytics and reporting features for AI governance insights."
      case "viewer":
        return "View dashboard metrics and system status information."
      default:
        return "Welcome to your AI governance dashboard."
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Responsive header that wraps on small screens */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight">
            {"Welcome back, "}
            {user.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">{getWelcomeMessage()}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-1 text-sm font-medium ${getRoleBadge(user.role)}`}>
            {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
          </span>
          <span className="rounded bg-muted px-2 py-1 text-sm font-medium">{user.organization}</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Connected Agents"
          subtitle={hasConnectedAgents ? "Active and monitored" : "No agents connected"}
          value={user.connectedAgents.length}
          icon={<Bot className="h-5 w-5" />}
          series={series.connected}
          delta={hasConnectedAgents ? { label: "Stable", positive: true } : undefined}
          className="min-w-0"
        />
        <StatCard
          title="Permissions"
          subtitle="Access levels granted"
          value={user.permissions.length}
          icon={<Shield className="h-5 w-5" />}
          series={series.perms}
          className="min-w-0"
        />
        <StatCard
          title="System Status"
          subtitle="All systems operational"
          value={<span className="text-green-600 dark:text-green-400">Healthy</span>}
          icon={<CheckCircle className="h-5 w-5" />}
          className="min-w-0"
          delta={{ label: "Stable", positive: true }}
        />
        <StatCard
          title="Active Alerts"
          subtitle="Real-time incidents"
          value={0}
          icon={<AlertTriangle className="h-5 w-5" />}
          series={series.alerts}
          delta={{ label: "All clear", positive: true }}
          className="min-w-0"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectedAgentsOverview />
        <QuickActions />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentActivity />
        <SystemHealth />
      </div>
    </div>
  )
}
