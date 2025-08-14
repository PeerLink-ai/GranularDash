"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, Shield, TrendingUp, Users, Activity } from "lucide-react"

interface RealTimeMetrics {
  agentHealth: Array<{
    name: string
    status: string
    health_status: string
    last_active: string
    error_count: number
    usage_requests: number
    usage_estimated_cost: number
    avg_response_time: number
    success_rate: number
  }>
  securityThreats: Array<{
    threat_type: string
    severity: string
    description: string
    detected_at: string
    status: string
  }>
  policyViolations: Array<{
    policy_name: string
    severity: string
    description: string
    detected_at: string
    agent_id: string
    status: string
  }>
  financialMetrics: {
    total_transactions: number
    total_revenue: number
    avg_transaction_value: number
    transactions_24h: number
  }
  subscriptionMetrics: {
    total_subscriptions: number
    active_subscriptions: number
    trial_subscriptions: number
    canceled_subscriptions: number
  }
  lastUpdated: string
}

export function RealTimeDashboard() {
  const [metrics, setMetrics] = useState<RealTimeMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/dashboard/real-time-metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default"
      case "healthy":
        return "default"
      case "warning":
        return "secondary"
      case "error":
        return "destructive"
      case "offline":
        return "outline"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!metrics) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load real-time metrics</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Real-Time Dashboard</h2>
          <p className="text-muted-foreground">Last updated: {new Date(metrics.lastUpdated).toLocaleTimeString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAutoRefresh(!autoRefresh)}>
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh: {autoRefresh ? "On" : "Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agentHealth.filter((a) => a.status === "active").length}</div>
            <p className="text-xs text-muted-foreground">of {metrics.agentHealth.length} total agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (24h)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(metrics.financialMetrics.total_revenue / 100).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.financialMetrics.transactions_24h} transactions today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.subscriptionMetrics.active_subscriptions}</div>
            <p className="text-xs text-muted-foreground">{metrics.subscriptionMetrics.trial_subscriptions} on trial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.securityThreats.length}</div>
            <p className="text-xs text-muted-foreground">Active threats detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Health Status</CardTitle>
          <CardDescription>Real-time monitoring of connected agents</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.agentHealth.map((agent, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <h4 className="font-medium">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last active: {agent.last_active ? new Date(agent.last_active).toLocaleString() : "Never"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{agent.success_rate.toFixed(1)}% success</div>
                    <div className="text-xs text-muted-foreground">
                      {agent.avg_response_time.toFixed(0)}ms avg response
                    </div>
                  </div>
                  <Progress value={agent.success_rate} className="w-20" />
                  <Badge variant={getStatusColor(agent.status)}>{agent.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Threats */}
      {metrics.securityThreats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Active Security Threats
            </CardTitle>
            <CardDescription>Immediate attention required</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.securityThreats.map((threat, index) => (
                <Alert key={index} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="flex items-center justify-between">
                    {threat.threat_type}
                    <Badge variant={getSeverityColor(threat.severity)}>{threat.severity}</Badge>
                  </AlertTitle>
                  <AlertDescription>
                    {threat.description}
                    <div className="text-xs mt-1">Detected: {new Date(threat.detected_at).toLocaleString()}</div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Policy Violations */}
      {metrics.policyViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Policy Violations</CardTitle>
            <CardDescription>Compliance issues requiring review</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.policyViolations.map((violation, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{violation.policy_name}</h4>
                    <p className="text-sm text-muted-foreground">{violation.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Agent: {violation.agent_id} • {new Date(violation.detected_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
