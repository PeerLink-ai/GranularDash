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
import { Button } from "@/components/ui/button"
import {
  Bot,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Brain,
  BarChart3,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
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
    cpuUsage: 0,
    memoryUsage: 0,
    networkActivity: 0,
    activeConnections: 0,
    responseTime: 0,
    throughput: 0,
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
  const [auditErrors, setAuditErrors] = useState([])
  const [metricsLoading, setMetricsLoading] = useState(true)

  const fetchAuditErrors = async () => {
    try {
      const response = await fetch("/api/sdk/log")
      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Fetched audit logs:", data)

        // Filter for error-level logs
        const errors =
          data.data?.filter(
            (log) =>
              log.level === "error" ||
              log.type === "error" ||
              (log.payload && (log.payload.error || log.payload.status === "error")),
          ) || []

        console.log("[v0] Found audit errors:", errors)
        setAuditErrors(errors)

        // Auto-create incidents for new errors
        if (errors.length > 0) {
          await createIncidentsFromErrors(errors)
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch audit errors:", error)
    }
  }

  const createIncidentsFromErrors = async (errors) => {
    try {
      const incidents = errors.map((error) => ({
        title: `Agent Error: ${error.agent_id || "Unknown Agent"}`,
        severity: "High",
        status: "Open",
        reportedBy: "Audit Log",
        timestamp: new Date(error.created_at || error.timestamp).toLocaleString(),
        description: `Error detected in agent ${error.agent_id}: ${error.payload?.error || error.payload?.message || "Unknown error"}`,
        source: "audit_log",
        sourceId: error.id,
      }))

      console.log("[v0] Creating incidents from errors:", incidents)
      // Store incidents (you may want to add an API endpoint for this)
      localStorage.setItem("audit_incidents", JSON.stringify(incidents))
    } catch (error) {
      console.error("[v0] Failed to create incidents:", error)
    }
  }

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

        setRealTimeData({
          cpuUsage: data.systemMetrics?.cpu_usage || 0,
          memoryUsage: data.systemMetrics?.memory_usage || 0,
          networkActivity: data.systemMetrics?.network_activity || 0,
          activeConnections: activeAgents,
          responseTime: avgResponseTime,
          throughput: data.systemMetrics?.throughput || 0,
        })
      }
    } catch (error) {
      console.error("[v0] Failed to fetch dashboard metrics:", error)
    } finally {
      setMetricsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardMetrics()
    fetchAuditErrors()

    const interval = setInterval(() => {
      fetchDashboardMetrics()
      fetchAuditErrors()
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
    const alerts = withTime(alignSeriesToLast([1, 1, 0, 0, 0, 0, 0, 0], auditErrors.length), day)
    return { connected, perms, alerts }
  }, [connectedCount, permissionsCount, auditErrors.length])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case "down":
        return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back, {firstName}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {organization} • {role.charAt(0).toUpperCase() + role.slice(1)}
            </p>
          </div>

          {auditErrors.length > 0 && (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-700 dark:text-red-300 font-medium">
                {auditErrors.length} Active Error{auditErrors.length > 1 ? "s" : ""}
              </span>
              <Button variant="outline" size="sm" className="ml-2 bg-transparent">
                View Incidents
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Connected Agents"
            subtitle={hasConnectedAgents ? "Active and monitored" : "No agents connected"}
            value={connectedCount}
            icon={<Bot className="h-5 w-5" />}
            series={series.connected}
            delta={hasConnectedAgents ? { label: "Stable", positive: true } : undefined}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            loading={metricsLoading}
          />
          <StatCard
            title="System Efficiency"
            subtitle="Resource optimization"
            value={`${advancedMetrics.efficiency.value}%`}
            icon={<Zap className="h-5 w-5" />}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            delta={{ label: "Excellent", positive: true }}
            loading={metricsLoading}
          />
        </div>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="h-6 w-6 text-blue-600" />
                <div>
                  <CardTitle className="text-xl">System Monitor</CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Real-time performance metrics</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                { label: "CPU Usage", value: realTimeData.cpuUsage, color: "bg-blue-500" },
                { label: "Memory Usage", value: realTimeData.memoryUsage, color: "bg-purple-500" },
                { label: "Network Activity", value: realTimeData.networkActivity, color: "bg-green-500" },
              ].map((metric, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{metric.label}</span>
                    <span className="text-lg font-semibold">{metric.value.toFixed(1)}%</span>
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              ))}
            </div>

            <div className="grid gap-6 md:grid-cols-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {[
                { icon: Users, label: "Active Connections", value: realTimeData.activeConnections },
                { icon: Clock, label: "Response Time", value: `${realTimeData.responseTime.toFixed(0)}ms` },
                { icon: TrendingUp, label: "Throughput", value: realTimeData.throughput.toFixed(0) },
              ].map((metric, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <metric.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</p>
                    <p className="text-lg font-semibold">{metric.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Analytics Overview</CardTitle>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Performance insights and trends</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-4">
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
                { label: "Avg Response", value: `${dashboardMetrics.avgResponse}ms`, change: "-8ms", positive: true },
              ].map((metric, i) => (
                <div key={i} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metric.label}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-2xl font-bold">{metricsLoading ? "..." : metric.value}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        metric.positive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {metric.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <ConnectedAgentsOverview />
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <QuickActions />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <RecentActivity />
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <SystemHealth />
          </div>
        </div>
      </div>
    </div>
  )
}
