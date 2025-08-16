"use client"

import { useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { StatCard, type SeriesPoint } from "@/components/ui/stat-card"
import { ConnectedAgentsOverview } from "@/components/connected-agents-overview"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Bot, Shield, AlertTriangle, CheckCircle, Sparkles } from "lucide-react"

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

  // Provide safe fallbacks to avoid reading `.length` on undefined.
  const connectedCount = user?.connectedAgents?.length ?? 0
  const permissionsCount = user?.permissions?.length ?? 0
  const role = user?.role ?? "viewer"
  const organization = user?.organization ?? "Organization"
  const firstName = user?.name?.split(" ")?.[0] ?? "User"

  const hasConnectedAgents = connectedCount > 0

  const series = useMemo(() => {
    const day = 24 * 60 * 60 * 1000
    const connected = withTime(alignSeriesToLast([4, 5, 6, 7, 8, 9, 9, 10], connectedCount), day)
    const perms = withTime(alignSeriesToLast([2, 3, 3, 4, 4, 5, 5, 6], permissionsCount), day)
    const alerts = withTime(alignSeriesToLast([1, 1, 0, 0, 0, 0, 0, 0], 0), day)
    return { connected, perms, alerts }
  }, [connectedCount, permissionsCount])

  const getRoleBadge = (r: string) => {
    switch (r) {
      case "admin":
        return "bg-gradient-to-r from-red-50 to-red-100 text-red-700 border border-red-200 dark:from-red-950/50 dark:to-red-900/50 dark:text-red-300 dark:border-red-800/50"
      case "developer":
        return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 dark:text-blue-300 dark:border-blue-800/50"
      case "analyst":
        return "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/50 dark:text-emerald-300 dark:border-emerald-800/50"
      case "viewer":
      default:
        return "bg-gradient-to-r from-slate-50 to-slate-100 text-slate-700 border border-slate-200 dark:from-slate-950/50 dark:to-slate-900/50 dark:text-slate-300 dark:border-slate-800/50"
    }
  }

  const getWelcomeMessage = () => {
    switch (role) {
      case "admin":
        return "You have full administrative access to all AI governance features."
      case "developer":
        return "Manage and test your connected AI agents with development tools."
      case "analyst":
        return "Access analytics and reporting features for AI governance insights."
      case "viewer":
      default:
        return "View dashboard metrics and system status information."
    }
  }

  // If your app expects authentication before showing the overview,
  // keep this guard. It also prevents rendering with an undefined user.
  if (!user) return null

  return (
    <div className="space-y-8 p-1">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 ring-1 ring-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans">Welcome back, {firstName}</h1>
              <p className="text-base text-muted-foreground font-medium">{getWelcomeMessage()}</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-lg px-3 py-2 text-sm font-semibold shadow-sm ${getRoleBadge(role)}`}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </span>
          <span className="rounded-lg bg-gradient-to-r from-muted to-muted/80 px-3 py-2 text-sm font-semibold text-muted-foreground border border-border/50 shadow-sm">
            {organization}
          </span>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Connected Agents"
          subtitle={hasConnectedAgents ? "Active and monitored" : "No agents connected"}
          value={connectedCount}
          icon={<Bot className="h-5 w-5" />}
          series={series.connected}
          delta={hasConnectedAgents ? { label: "Stable", positive: true } : undefined}
          className="min-w-0 border-l-4 border-l-primary/60"
        />
        <StatCard
          title="Permissions"
          subtitle="Access levels granted"
          value={permissionsCount}
          icon={<Shield className="h-5 w-5" />}
          series={series.perms}
          className="min-w-0 border-l-4 border-l-blue-500/60"
        />
        <StatCard
          title="System Status"
          subtitle="All systems operational"
          value={<span className="text-emerald-600 dark:text-emerald-400 font-semibold">Healthy</span>}
          icon={<CheckCircle className="h-5 w-5" />}
          className="min-w-0 border-l-4 border-l-emerald-500/60"
          delta={{ label: "Stable", positive: true }}
        />
        <StatCard
          title="Active Alerts"
          subtitle="Real-time incidents"
          value={0}
          icon={<AlertTriangle className="h-5 w-5" />}
          series={series.alerts}
          delta={{ label: "All clear", positive: true }}
          className="min-w-0 border-l-4 border-l-emerald-500/60"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <ConnectedAgentsOverview />
        <QuickActions />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <RecentActivity />
        <SystemHealth />
      </div>
    </div>
  )
}
