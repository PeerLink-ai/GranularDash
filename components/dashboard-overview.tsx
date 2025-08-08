"use client"

import { useAuth } from "@/contexts/auth-context"
import { Badge } from "@/components/ui/badge"
import { ConnectedAgentsOverview } from "@/components/connected-agents-overview"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Bot, Shield, AlertTriangle, CheckCircle, Activity, TrendingUp } from 'lucide-react'
import { KPICard } from "@/components/ui/kpi-card"

export function DashboardOverview() {
  const { user } = useAuth()
  if (!user) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "developer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "analyst":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const getWelcomeMessage = () => {
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

  const hasConnectedAgents = user.connectedAgents.length > 0

  // Fake trend data for visuals
  const agentsTrend = [2, 3, 4, 5, 4, 6, 6, 7]
  const permsTrend = [1, 2, 2, 3, 3, 4, 3, 5]
  const healthTrend = [80, 85, 83, 88, 92, 95, 93, 96]
  const alertsTrend = [3, 2, 2, 1, 1, 0, 0, 0]

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1">{getWelcomeMessage()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getRoleColor(user.role)}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
          <Badge variant="outline">{user.organization}</Badge>
        </div>
      </div>

      {/* Upgraded Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Connected Agents"
          value={user.connectedAgents.length}
          subtitle={hasConnectedAgents ? "Active and monitored" : "No agents connected"}
          icon={Bot}
          tone="violet"
          trendData={agentsTrend}
          trendLabel="+2 this week"
        />
        <KPICard
          title="Permissions"
          value={user.permissions.length}
          subtitle="Access levels granted"
          icon={Shield}
          tone="sky"
          trendData={permsTrend}
          trendLabel="+1 new role"
        />
        <KPICard
          title="System Status"
          value="Healthy"
          subtitle="All systems operational"
          icon={CheckCircle}
          tone="emerald"
          trendData={healthTrend}
          trendLabel="Uptime 99.9%"
        />
        <KPICard
          title="Active Alerts"
          value={0}
          subtitle="No active alerts"
          icon={AlertTriangle}
          tone="amber"
          trendData={alertsTrend}
          trendLabel="Down from 3"
        />
      </div>

      {/* Bonus: small banner */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="h-4 w-4" />
        <span>Tip: Connect more agents to unlock advanced analytics</span>
        <TrendingUp className="h-4 w-4" />
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
