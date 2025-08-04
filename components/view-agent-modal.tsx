"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, AlertTriangle, Clock, Zap } from "lucide-react"

interface Agent {
  id: string
  name: string
  type: string
  status: string
  last_active: string
  health_status: string
}

interface ViewAgentModalProps {
  agent: Agent
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface AgentLog {
  id: string
  interaction_type: string
  input_data: string
  output_data: string
  timestamp: string
  metadata: any
}

interface PolicyViolation {
  id: string
  violation_type: string
  severity: string
  description: string
  detected_at: string
  status: string
}

export function ViewAgentModal({ agent, open, onOpenChange }: ViewAgentModalProps) {
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && agent) {
      fetchAgentData()
    }
  }, [open, agent])

  const fetchAgentData = async () => {
    setLoading(true)
    try {
      // Fetch logs
      const logsResponse = await fetch(`/api/agents/${agent.id}/logs`)
      if (logsResponse.ok) {
        const logsData = await logsResponse.json()
        setLogs(logsData.logs || [])
      }

      // Fetch violations
      const violationsResponse = await fetch(`/api/agents/${agent.id}/violations`)
      if (violationsResponse.ok) {
        const violationsData = await violationsResponse.json()
        setViolations(violationsData.violations || [])
      }
    } catch (error) {
      console.error("Error fetching agent data:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
      case "critical":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {agent.name}
            <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
            <Badge variant={agent.health_status === "healthy" ? "default" : "destructive"}>{agent.health_status}</Badge>
          </DialogTitle>
          <DialogDescription>Monitor logs, violations, and performance metrics for this agent</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{logs.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{violations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Active</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">{agent.last_active ? formatTimestamp(agent.last_active) : "Never"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Agent Type</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{agent.type}</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed view */}
          <Tabs defaultValue="logs" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
              <TabsTrigger value="violations">Policy Violations</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest interactions and events from this agent</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading logs...</div>
                  ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No activity logs found</div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {logs.map((log) => (
                          <div key={log.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="outline">{log.interaction_type}</Badge>
                              <span className="text-sm text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <span className="text-sm font-medium">Input:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {log.input_data || "No input data"}
                                </p>
                              </div>
                              <div>
                                <span className="text-sm font-medium">Output:</span>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {log.output_data || "No output data"}
                                </p>
                              </div>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div>
                                  <span className="text-sm font-medium">Metadata:</span>
                                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="violations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Policy Violations</CardTitle>
                  <CardDescription>Compliance violations detected for this agent</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading violations...</div>
                  ) : violations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No policy violations found</div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-4">
                        {violations.map((violation) => (
                          <div key={violation.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Badge variant={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                                <Badge variant="outline">{violation.violation_type}</Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatTimestamp(violation.detected_at)}
                              </span>
                            </div>
                            <p className="text-sm">{violation.description}</p>
                            <div className="mt-2">
                              <Badge variant={violation.status === "open" ? "destructive" : "default"}>
                                {violation.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
