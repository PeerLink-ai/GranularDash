"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Activity, AlertTriangle, CheckCircle, Clock, Eye, RefreshCw } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface AgentLog {
  id: string
  agent_id: string
  agent_name: string
  log_level: string
  message: string
  details: any
  timestamp: string
}

interface PolicyViolation {
  id: string
  agent_id: string
  policy_name: string
  severity: string
  description: string
  status: string
  detected_at: string
}

export function AgentMonitoringDashboard({ agentId }: { agentId: string }) {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("logs")

  useEffect(() => {
    if (agentId) {
      fetchData()
      // Set up polling for real-time updates
      const interval = setInterval(fetchData, 30000)
      return () => clearInterval(interval)
    }
  }, [agentId])

  const fetchData = async () => {
    try {
      const [logsResponse, violationsResponse] = await Promise.all([
        fetch(`/api/agents/${agentId}/logs?limit=100`),
        fetch(`/api/agents/${agentId}/violations`),
      ])

      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData.logs || [])
      }

      if (violationsResponse.ok) {
        const violationsData = await violationsResponse.json()
        setViolations(violationsData.violations || [])
      }
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "info":
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "warn":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Agent Monitoring</CardTitle>
          <CardDescription>Real-time logs, violations, and compliance monitoring</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="logs">Activity Logs ({logs.length})</TabsTrigger>
            <TabsTrigger value="violations">Policy Violations ({violations.length})</TabsTrigger>
            <TabsTrigger value="metrics">Metrics & Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Activity Logs</h3>
                <p className="text-muted-foreground">Start sending data from your agent to see activity logs here.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="mt-1">{getLogLevelIcon(log.log_level)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{log.message}</p>
                        <div className="flex items-center space-x-2">
                          <Badge className={getLogLevelColor(log.log_level)} variant="secondary">
                            {log.log_level}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                        </div>
                      </div>
                      {log.details && (
                        <div className="mt-2">
                          <details className="text-xs">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="violations" className="space-y-4">
            {violations.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Policy Violations</h3>
                <p className="text-muted-foreground">Your agent is operating within all defined policies.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Policy</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Detected</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell className="font-medium">{violation.policy_name}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(violation.severity)} variant="secondary">
                          {violation.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{violation.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{violation.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(violation.detected_at)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{logs.length}</div>
                  <p className="text-xs text-muted-foreground">+12% from last hour</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{violations.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {violations.filter((v) => v.status === "open").length} open
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1.2s</div>
                  <p className="text-xs text-muted-foreground">-0.3s from yesterday</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.5%</div>
                  <p className="text-xs text-muted-foreground">+0.5% this week</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
