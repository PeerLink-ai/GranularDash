"use client"

import { useMemo, useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { StatCard, type SeriesPoint } from "@/components/ui/stat-card"
import { ConnectedAgentsOverview } from "@/components/connected-agents-overview"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Shield,
  Sparkles,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Brain,
  BarChart3,
  PieChart,
  LineChart,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react"

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
  const [realTimeData, setRealTimeData] = useState({
    cpuUsage: 45,
    memoryUsage: 62,
    networkActivity: 78,
    activeConnections: 24,
    responseTime: 120,
    throughput: 1250,
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData((prev) => ({
        cpuUsage: Math.max(20, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(30, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        networkActivity: Math.max(40, Math.min(95, prev.networkActivity + (Math.random() - 0.5) * 15)),
        activeConnections: Math.max(10, Math.min(50, prev.activeConnections + Math.floor((Math.random() - 0.5) * 6))),
        responseTime: Math.max(80, Math.min(200, prev.responseTime + (Math.random() - 0.5) * 20)),
        throughput: Math.max(800, Math.min(2000, prev.throughput + (Math.random() - 0.5) * 100)),
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const advancedMetrics = useMemo(() => {
    const efficiency = Math.round((100 - realTimeData.cpuUsage) * 0.6 + (100 - realTimeData.memoryUsage) * 0.4)
    const performance = Math.round((2000 - realTimeData.responseTime) / 20 + realTimeData.throughput / 25)
    const reliability = Math.round(95 + Math.random() * 4)

    return {
      efficiency: { value: efficiency, trend: efficiency > 70 ? "up" : efficiency < 50 ? "down" : "stable" },
      performance: { value: performance, trend: performance > 80 ? "up" : performance < 60 ? "down" : "stable" },
      reliability: { value: reliability, trend: "up" },
    }
  }, [realTimeData])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-emerald-500" />
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-slate-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-emerald-600 dark:text-emerald-400"
      case "down":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-slate-600 dark:text-slate-400"
    }
  }

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
          className="min-w-0 border-l-4 border-l-primary/60 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
        />
        <StatCard
          title="System Efficiency"
          subtitle="Resource optimization"
          value={`${advancedMetrics.efficiency.value}%`}
          icon={<Zap className="h-5 w-5" />}
          className="min-w-0 border-l-4 border-l-amber-500/60 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          delta={{
            label: `${advancedMetrics.efficiency.trend === "up" ? "+" : advancedMetrics.efficiency.trend === "down" ? "-" : ""}${Math.abs(Math.random() * 5).toFixed(1)}%`,
            positive: advancedMetrics.efficiency.trend === "up",
          }}
        />
        <StatCard
          title="Performance Score"
          subtitle="Response & throughput"
          value={advancedMetrics.performance.value}
          icon={<Target className="h-5 w-5" />}
          className="min-w-0 border-l-4 border-l-blue-500/60 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          delta={{
            label: `${advancedMetrics.performance.trend === "up" ? "+" : advancedMetrics.performance.trend === "down" ? "-" : ""}${Math.abs(Math.random() * 3).toFixed(0)} pts`,
            positive: advancedMetrics.performance.trend === "up",
          }}
        />
        <StatCard
          title="AI Reliability"
          subtitle="Model accuracy"
          value={`${advancedMetrics.reliability.value}%`}
          icon={<Brain className="h-5 w-5" />}
          className="min-w-0 border-l-4 border-l-emerald-500/60 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
          delta={{ label: "Excellent", positive: true }}
        />
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-background to-muted/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/10 to-primary/20">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold">Real-Time System Monitor</CardTitle>
                <p className="text-sm text-muted-foreground">Live performance metrics and resource utilization</p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">CPU Usage</span>
                <span className="text-sm font-semibold">{realTimeData.cpuUsage.toFixed(1)}%</span>
              </div>
              <Progress value={realTimeData.cpuUsage} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Memory Usage</span>
                <span className="text-sm font-semibold">{realTimeData.memoryUsage.toFixed(1)}%</span>
              </div>
              <Progress value={realTimeData.memoryUsage} className="h-2" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Network Activity</span>
                <span className="text-sm font-semibold">{realTimeData.networkActivity.toFixed(1)}%</span>
              </div>
              <Progress value={realTimeData.networkActivity} className="h-2" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Active Connections</p>
                  <p className="text-xs text-muted-foreground">Current sessions</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{realTimeData.activeConnections}</p>
                {getTrendIcon(advancedMetrics.efficiency.trend)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium">Response Time</p>
                  <p className="text-xs text-muted-foreground">Average latency</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{realTimeData.responseTime.toFixed(0)}ms</p>
                {getTrendIcon(advancedMetrics.performance.trend)}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium">Throughput</p>
                  <p className="text-xs text-muted-foreground">Requests/min</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{realTimeData.throughput.toFixed(0)}</p>
                {getTrendIcon("up")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-500/20">
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-xl font-semibold">Advanced Analytics</CardTitle>
              <p className="text-sm text-muted-foreground">Comprehensive insights and performance trends</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <PieChart className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center gap-2">
                <LineChart className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="agents" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Total Requests", value: "24.7K", change: "+12.5%", positive: true },
                  { label: "Success Rate", value: "99.2%", change: "+0.3%", positive: true },
                  { label: "Error Rate", value: "0.8%", change: "-0.2%", positive: true },
                  { label: "Avg Response", value: "145ms", change: "-8ms", positive: true },
                ].map((metric, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                    <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-2xl font-bold">{metric.value}</p>
                      <span className={`text-xs font-medium ${metric.positive ? "text-emerald-600" : "text-red-600"}`}>
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Performance analytics visualization would be rendered here</p>
                <p className="text-sm">Real-time charts and performance metrics</p>
              </div>
            </TabsContent>

            <TabsContent value="agents" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Agent-specific analytics and insights</p>
                <p className="text-sm">Individual agent performance and usage patterns</p>
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Security monitoring and threat analysis</p>
                <p className="text-sm">Real-time security alerts and compliance status</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
