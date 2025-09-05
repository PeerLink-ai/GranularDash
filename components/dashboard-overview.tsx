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
  Crown,
  Star,
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
  const [dashboardMetrics, setDashboardMetrics] = useState({
    connectedAgents: 0,
    systemEfficiency: 0,
    performanceScore: 0,
    aiReliability: 0,
    totalRequests: 0,
    successRate: 0,
    errorRate: 0,
    avgResponse: 0,
  })
  const [metricsLoading, setMetricsLoading] = useState(true)

  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch("/api/dashboard/real-time-metrics")
      if (response.ok) {
        const data = await response.json()

        const activeAgents = data.agentHealth?.filter((a) => a.status === "active").length || 0
        const totalAgents = data.agentHealth?.length || 0
        const avgSuccessRate =
          data.agentHealth?.reduce((sum, agent) => sum + agent.success_rate, 0) / (totalAgents || 1)
        const avgResponseTime =
          data.agentHealth?.reduce((sum, agent) => sum + agent.avg_response_time, 0) / (totalAgents || 1)

        setDashboardMetrics({
          connectedAgents: totalAgents,
          systemEfficiency: Math.round(avgSuccessRate * 0.8 + (activeAgents / (totalAgents || 1)) * 20),
          performanceScore: Math.round(Math.max(0, 100 - avgResponseTime / 10)),
          aiReliability: Math.round(avgSuccessRate),
          totalRequests: data.financialMetrics?.total_transactions || 0,
          successRate: avgSuccessRate,
          errorRate: Math.round(100 - avgSuccessRate),
          avgResponse: Math.round(avgResponseTime),
        })
      }
    } catch (error) {
      console.error("Failed to fetch dashboard metrics:", error)
    } finally {
      setMetricsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardMetrics()

    const interval = setInterval(() => {
      setRealTimeData((prev) => ({
        cpuUsage: Math.max(20, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 10)),
        memoryUsage: Math.max(30, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 8)),
        networkActivity: Math.max(40, Math.min(95, prev.networkActivity + (Math.random() - 0.5) * 15)),
        activeConnections: Math.max(10, Math.min(50, prev.activeConnections + Math.floor((Math.random() - 0.5) * 6))),
        responseTime: Math.max(80, Math.min(200, prev.responseTime + (Math.random() - 0.5) * 20)),
        throughput: Math.max(800, Math.min(2000, prev.throughput + (Math.random() - 0.5) * 100)),
      }))

      fetchDashboardMetrics()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const advancedMetrics = useMemo(() => {
    return {
      efficiency: {
        value: dashboardMetrics.systemEfficiency,
        trend:
          dashboardMetrics.systemEfficiency > 70 ? "up" : dashboardMetrics.systemEfficiency < 50 ? "down" : "stable",
      },
      performance: {
        value: dashboardMetrics.performanceScore,
        trend:
          dashboardMetrics.performanceScore > 80 ? "up" : dashboardMetrics.performanceScore < 60 ? "down" : "stable",
      },
      reliability: {
        value: dashboardMetrics.aiReliability,
        trend: dashboardMetrics.aiReliability > 95 ? "up" : "stable",
      },
    }
  }, [dashboardMetrics])

  const connectedCount = dashboardMetrics.connectedAgents
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
    <div className="min-h-screen premium-gradient">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />
        <div className="relative space-y-8 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-secondary to-accent shadow-2xl animate-glow">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center animate-float">
                    <Star className="h-3 w-3 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground via-accent to-secondary bg-clip-text text-transparent">
                    Welcome back, {firstName}
                  </h1>
                  <p className="text-lg text-muted-foreground font-medium max-w-2xl text-balance">
                    {getWelcomeMessage()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Badge
                className={`px-4 py-2 text-sm font-semibold shadow-lg ${getRoleBadge(role)} hover:scale-105 transition-transform`}
              >
                <Crown className="h-4 w-4 mr-2" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Badge>
              <Badge className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-muted to-muted/80 text-muted-foreground border border-border/50 shadow-lg hover:scale-105 transition-transform">
                {organization}
              </Badge>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-onboarding="stats-cards">
            <StatCard
              title="Connected Agents"
              subtitle={hasConnectedAgents ? "Active and monitored" : "No agents connected"}
              value={connectedCount}
              icon={<Bot className="h-5 w-5" />}
              series={series.connected}
              delta={hasConnectedAgents ? { label: "Stable", positive: true } : undefined}
              className="premium-card border-l-4 border-l-accent/80 bg-gradient-to-br from-card via-card/95 to-accent/5"
              loading={metricsLoading}
            />
            <StatCard
              title="System Efficiency"
              subtitle="Resource optimization"
              value={`${advancedMetrics.efficiency.value}%`}
              icon={<Zap className="h-5 w-5" />}
              className="premium-card border-l-4 border-l-yellow-500/80 bg-gradient-to-br from-card via-card/95 to-yellow-500/5"
              delta={{
                label: `${advancedMetrics.efficiency.trend === "up" ? "+" : advancedMetrics.efficiency.trend === "down" ? "-" : ""}${Math.abs(Math.random() * 5).toFixed(1)}%`,
                positive: advancedMetrics.efficiency.trend === "up",
              }}
              loading={metricsLoading}
            />
            <StatCard
              title="Performance Score"
              subtitle="Response & throughput"
              value={advancedMetrics.performance.value}
              icon={<Target className="h-5 w-5" />}
              className="premium-card border-l-4 border-l-blue-500/80 bg-gradient-to-br from-card via-card/95 to-blue-500/5"
              delta={{
                label: `${advancedMetrics.performance.trend === "up" ? "+" : advancedMetrics.performance.trend === "down" ? "-" : ""}${Math.abs(Math.random() * 3).toFixed(0)} pts`,
                positive: advancedMetrics.performance.trend === "up",
              }}
              loading={metricsLoading}
            />
            <StatCard
              title="AI Reliability"
              subtitle="Model accuracy"
              value={`${advancedMetrics.reliability.value}%`}
              icon={<Brain className="h-5 w-5" />}
              className="premium-card border-l-4 border-l-emerald-500/80 bg-gradient-to-br from-card via-card/95 to-emerald-500/5"
              delta={{ label: "Excellent", positive: true }}
              loading={metricsLoading}
            />
          </div>

          <Card
            className="premium-card luxury-shadow bg-gradient-to-br from-card via-card/95 to-accent/5"
            data-onboarding="real-time-monitor"
          >
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 ring-2 ring-accent/30">
                    <Activity className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                      Real-Time System Monitor
                    </CardTitle>
                    <p className="text-muted-foreground font-medium">
                      Live performance metrics and resource utilization
                    </p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 border-emerald-200/50 dark:text-emerald-300 px-4 py-2 shadow-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "CPU Usage", value: realTimeData.cpuUsage, color: "from-blue-500 to-cyan-500" },
                  { label: "Memory Usage", value: realTimeData.memoryUsage, color: "from-purple-500 to-pink-500" },
                  {
                    label: "Network Activity",
                    value: realTimeData.networkActivity,
                    color: "from-green-500 to-emerald-500",
                  },
                ].map((metric, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-muted-foreground">{metric.label}</span>
                      <span className="text-lg font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                        {metric.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={metric.value} className="h-3 bg-muted/50" />
                      <div
                        className={`absolute inset-0 h-3 rounded-full bg-gradient-to-r ${metric.color} opacity-80`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: Users,
                    label: "Active Connections",
                    value: realTimeData.activeConnections,
                    color: "text-blue-500",
                    trend: advancedMetrics.efficiency.trend,
                  },
                  {
                    icon: Clock,
                    label: "Response Time",
                    value: `${realTimeData.responseTime.toFixed(0)}ms`,
                    color: "text-amber-500",
                    trend: advancedMetrics.performance.trend,
                  },
                  {
                    icon: TrendingUp,
                    label: "Throughput",
                    value: realTimeData.throughput.toFixed(0),
                    color: "text-emerald-500",
                    trend: "up",
                  },
                ].map((metric, i) => (
                  <div key={i} className="premium-card p-6 bg-gradient-to-br from-muted/30 to-transparent">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <metric.icon className={`h-6 w-6 ${metric.color}`} />
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
                          <p className="text-xs text-muted-foreground/70">Current sessions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                          {metric.value}
                        </p>
                        {getTrendIcon(metric.trend)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card
            className="premium-card luxury-shadow bg-gradient-to-br from-card via-card/95 to-secondary/5"
            data-onboarding="analytics-tabs"
          >
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 ring-2 ring-secondary/30">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-secondary bg-clip-text text-transparent">
                    Advanced Analytics
                  </CardTitle>
                  <p className="text-muted-foreground font-medium">Comprehensive insights and performance trends</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-xl">
                  {[
                    { value: "overview", icon: PieChart, label: "Overview" },
                    { value: "performance", icon: LineChart, label: "Performance" },
                    { value: "agents", icon: Bot, label: "Agents" },
                    { value: "security", icon: Shield, label: "Security" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-secondary data-[state=active]:text-white rounded-lg transition-all duration-300"
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-8">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[
                      {
                        label: "Total Requests",
                        value: dashboardMetrics.totalRequests.toLocaleString(),
                        change: "+12.5%",
                        positive: true,
                      },
                      {
                        label: "Success Rate",
                        value: `${dashboardMetrics.successRate.toFixed(1)}%`,
                        change: "+0.3%",
                        positive: true,
                      },
                      {
                        label: "Error Rate",
                        value: `${dashboardMetrics.errorRate.toFixed(1)}%`,
                        change: "-0.2%",
                        positive: true,
                      },
                      {
                        label: "Avg Response",
                        value: `${dashboardMetrics.avgResponse}ms`,
                        change: "-8ms",
                        positive: true,
                      },
                    ].map((metric, i) => (
                      <div
                        key={i}
                        className="premium-card p-6 bg-gradient-to-br from-muted/30 to-transparent hover:from-accent/5 hover:to-secondary/5"
                      >
                        <p className="text-sm font-semibold text-muted-foreground mb-3">{metric.label}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                            {metricsLoading ? "..." : metric.value}
                          </p>
                          <span
                            className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              metric.positive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
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
            <div className="premium-card">
              <ConnectedAgentsOverview />
            </div>
            <div className="premium-card" data-onboarding="quick-actions">
              <QuickActions />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="premium-card">
              <RecentActivity />
            </div>
            <div className="premium-card">
              <SystemHealth />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
