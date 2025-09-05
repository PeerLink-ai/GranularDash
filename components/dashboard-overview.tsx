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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--accent)_0%,_transparent_50%)] opacity-5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--secondary)_0%,_transparent_50%)] opacity-5" />

        <div className="relative space-y-10 p-8 max-w-[1600px] mx-auto">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent to-secondary rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-secondary to-accent shadow-2xl ring-1 ring-white/10">
                    <Crown className="h-10 w-10 text-white drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg ring-2 ring-background">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="space-y-3">
                  <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground via-accent to-secondary bg-clip-text text-transparent leading-tight">
                    Welcome back, {firstName}
                  </h1>
                  <p className="text-xl text-muted-foreground font-medium max-w-3xl leading-relaxed">
                    {getWelcomeMessage()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Badge
                className={`px-6 py-3 text-sm font-semibold shadow-xl backdrop-blur-sm ${getRoleBadge(role)} hover:scale-105 transition-all duration-300 ring-1 ring-white/10`}
              >
                <Crown className="h-4 w-4 mr-2" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </Badge>
              <Badge className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-muted to-muted/80 text-muted-foreground border border-border/50 shadow-xl hover:scale-105 transition-all duration-300 backdrop-blur-sm ring-1 ring-white/5">
                {organization}
              </Badge>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" data-onboarding="stats-cards">
            <StatCard
              title="Connected Agents"
              subtitle={hasConnectedAgents ? "Active and monitored" : "No agents connected"}
              value={connectedCount}
              icon={<Bot className="h-5 w-5" />}
              series={series.connected}
              delta={hasConnectedAgents ? { label: "Stable", positive: true } : undefined}
              className="group hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-accent/80 bg-gradient-to-br from-card via-card/95 to-accent/5 shadow-xl hover:shadow-2xl ring-1 ring-white/5 backdrop-blur-sm"
              loading={metricsLoading}
            />
            <StatCard
              title="System Efficiency"
              subtitle="Resource optimization"
              value={`${advancedMetrics.efficiency.value}%`}
              icon={<Zap className="h-5 w-5" />}
              className="group hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-yellow-500/80 bg-gradient-to-br from-card via-card/95 to-yellow-500/5 shadow-xl hover:shadow-2xl ring-1 ring-white/5 backdrop-blur-sm"
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
              className="group hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-blue-500/80 bg-gradient-to-br from-card via-card/95 to-blue-500/5 shadow-xl hover:shadow-2xl ring-1 ring-white/5 backdrop-blur-sm"
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
              className="group hover:scale-[1.02] transition-all duration-300 border-l-4 border-l-emerald-500/80 bg-gradient-to-br from-card via-card/95 to-emerald-500/5 shadow-xl hover:shadow-2xl ring-1 ring-white/5 backdrop-blur-sm"
              delta={{ label: "Excellent", positive: true }}
              loading={metricsLoading}
            />
          </div>

          <Card
            className="group hover:scale-[1.005] transition-all duration-500 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-card via-card/95 to-accent/5 ring-1 ring-white/5 backdrop-blur-sm"
            data-onboarding="real-time-monitor"
          >
            <CardHeader className="pb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-accent/50 to-secondary/50 rounded-2xl blur opacity-25"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-accent/20 to-secondary/20 ring-2 ring-accent/30 shadow-lg">
                      <Activity className="h-8 w-8 text-accent" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                      Real-Time System Monitor
                    </CardTitle>
                    <p className="text-lg text-muted-foreground font-medium">
                      Live performance metrics and resource utilization
                    </p>
                  </div>
                </div>
                <Badge className="bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 border-emerald-200/50 dark:text-emerald-300 px-6 py-3 shadow-lg ring-1 ring-emerald-200/20">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3 animate-pulse shadow-lg shadow-emerald-500/50" />
                  Live
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-10">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {[
                  { label: "CPU Usage", value: realTimeData.cpuUsage, color: "from-blue-500 to-cyan-500" },
                  { label: "Memory Usage", value: realTimeData.memoryUsage, color: "from-purple-500 to-pink-500" },
                  {
                    label: "Network Activity",
                    value: realTimeData.networkActivity,
                    color: "from-green-500 to-emerald-500",
                  },
                ].map((metric, i) => (
                  <div key={i} className="space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-muted-foreground tracking-wide">{metric.label}</span>
                      <span className="text-2xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                        {metric.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={metric.value} className="h-4 bg-muted/50 shadow-inner" />
                      <div
                        className={`absolute inset-0 h-4 rounded-full bg-gradient-to-r ${metric.color} opacity-90 shadow-lg`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-8 md:grid-cols-3">
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
                  <div
                    key={i}
                    className="group hover:scale-105 transition-all duration-300 p-8 bg-gradient-to-br from-muted/30 to-transparent rounded-2xl shadow-lg hover:shadow-xl ring-1 ring-white/5 backdrop-blur-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <metric.icon className={`h-8 w-8 ${metric.color} drop-shadow-sm`} />
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground tracking-wide">{metric.label}</p>
                          <p className="text-xs text-muted-foreground/70">Current sessions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
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
            className="group hover:scale-[1.005] transition-all duration-500 shadow-2xl hover:shadow-3xl bg-gradient-to-br from-card via-card/95 to-secondary/5 ring-1 ring-white/5 backdrop-blur-sm"
            data-onboarding="analytics-tabs"
          >
            <CardHeader className="pb-8">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-secondary/50 to-accent/50 rounded-2xl blur opacity-25"></div>
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 ring-2 ring-secondary/30 shadow-lg">
                    <BarChart3 className="h-8 w-8 text-secondary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold bg-gradient-to-r from-foreground to-secondary bg-clip-text text-transparent">
                    Advanced Analytics
                  </CardTitle>
                  <p className="text-lg text-muted-foreground font-medium">
                    Comprehensive insights and performance trends
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-2 rounded-2xl shadow-inner ring-1 ring-white/5">
                  {[
                    { value: "overview", icon: PieChart, label: "Overview" },
                    { value: "performance", icon: LineChart, label: "Performance" },
                    { value: "agents", icon: Bot, label: "Agents" },
                    { value: "security", icon: Shield, label: "Security" },
                  ].map((tab) => (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      className="flex items-center gap-3 py-3 px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-accent data-[state=active]:to-secondary data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 font-medium"
                    >
                      <tab.icon className="h-5 w-5" />
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <TabsContent value="overview" className="space-y-8 mt-10">
                  <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
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
                        className="group hover:scale-105 transition-all duration-300 p-8 bg-gradient-to-br from-muted/30 to-transparent hover:from-accent/5 hover:to-secondary/5 rounded-2xl shadow-lg hover:shadow-xl ring-1 ring-white/5 backdrop-blur-sm"
                      >
                        <p className="text-sm font-semibold text-muted-foreground mb-4 tracking-wide">{metric.label}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-accent bg-clip-text text-transparent">
                            {metricsLoading ? "..." : metric.value}
                          </p>
                          <span
                            className={`text-sm font-semibold px-3 py-2 rounded-full shadow-sm ${
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

          <div className="grid gap-10 lg:grid-cols-2">
            <div className="group hover:scale-[1.005] transition-all duration-500 shadow-xl hover:shadow-2xl rounded-2xl ring-1 ring-white/5 backdrop-blur-sm">
              <ConnectedAgentsOverview />
            </div>
            <div
              className="group hover:scale-[1.005] transition-all duration-500 shadow-xl hover:shadow-2xl rounded-2xl ring-1 ring-white/5 backdrop-blur-sm"
              data-onboarding="quick-actions"
            >
              <QuickActions />
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-2">
            <div className="group hover:scale-[1.005] transition-all duration-500 shadow-xl hover:shadow-2xl rounded-2xl ring-1 ring-white/5 backdrop-blur-sm">
              <RecentActivity />
            </div>
            <div className="group hover:scale-[1.005] transition-all duration-500 shadow-xl hover:shadow-2xl rounded-2xl ring-1 ring-white/5 backdrop-blur-sm">
              <SystemHealth />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
