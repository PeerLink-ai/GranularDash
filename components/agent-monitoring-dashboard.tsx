"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, AlertTriangle, Clock, Zap, Eye, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface AgentLog {
  id: string
  interaction_type: string
  input_data: string
  output_data: string
  metadata: any
  timestamp: string
  created_at: string
}

interface PolicyViolation {
  id: string
  violation_type: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  detected_at: string
  interaction_type: string
}

interface AgentMonitoringDashboardProps {
  agentId: string
  agentName: string
}

export function AgentMonitoringDashboard({ agentId, agentName }: AgentMonitoringDashboardProps) {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/agents/${agentId}/logs`)
      if (response.ok) {
        const data = await response.json()
        setLogs(data.logs || [])
        setViolations(data.violations || [])
        setLastRefresh(new Date())
      }
    } catch (error) {
      console.error("Error fetching agent data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [agentId])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "secondary"
    }
  }

  const getViolationIcon = (type: string) => {
    switch (type) {
      case "sensitive_data_exposure":
        return <Eye className="h-4 w-4" />
      case "performance_violation":
        return <Clock className="h-4 w-4" />
      case "resource_violation":
        return <Zap className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const recentViolations = violations.filter(
    (v) => new Date(v.detected_at) > new Date(Date.now() - 24 * 60 * 60 * 1000),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{agentName} Monitoring</h2>
          <p className="text-muted-foreground">Last updated {formatDistanceToNow(lastRefresh)} ago</p>
        </div>
        <Button onClick={fetchData} disabled={isLoading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
            <p className="text-xs text-muted-foreground">All time interactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{violations.length}</div>
            <p className="text-xs text-muted-foreground">{recentViolations.length} in last 24h</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.length > 0
                ? Math.round(logs.reduce((acc, log) => acc + (log.metadata?.response_time_ms || 0), 0) / logs.length)
                : 0}
              ms
            </div>
            <p className="text-xs text-muted-foreground">Average response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.reduce((acc, log) => acc + (log.metadata?.tokens_used || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total tokens consumed</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Violations Alert */}
      {recentViolations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {recentViolations.length} policy violation{recentViolations.length > 1 ? "s" : ""} detected in the last 24
            hours. Review the violations tab for details.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="logs" className="w-full">
        <TabsList>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="violations">
            Policy Violations
            {violations.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {violations.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest interactions and activities from your agent</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {logs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No activity logs found. Start using your agent to see data here.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div key={log.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{log.interaction_type}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(log.timestamp))} ago
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm font-medium">Input:</p>
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                              {log.input_data?.substring(0, 200)}
                              {log.input_data?.length > 200 ? "..." : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Output:</p>
                            <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                              {log.output_data?.substring(0, 200)}
                              {log.output_data?.length > 200 ? "..." : ""}
                            </p>
                          </div>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <div className="flex gap-2 text-xs">
                              {log.metadata.response_time_ms && (
                                <Badge variant="secondary">{log.metadata.response_time_ms}ms</Badge>
                              )}
                              {log.metadata.tokens_used && (
                                <Badge variant="secondary">{log.metadata.tokens_used} tokens</Badge>
                              )}
                              {log.metadata.model && <Badge variant="secondary">{log.metadata.model}</Badge>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Violations</CardTitle>
              <CardDescription>Detected violations of your governance policies</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {violations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No policy violations detected. Your agent is compliant!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {violations.map((violation) => (
                      <div key={violation.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getViolationIcon(violation.violation_type)}
                            <Badge variant={getSeverityColor(violation.severity)}>
                              {violation.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline">{violation.interaction_type}</Badge>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(violation.detected_at))} ago
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {violation.violation_type.replace(/_/g, " ").toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">{violation.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
