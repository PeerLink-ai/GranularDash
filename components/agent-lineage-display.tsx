"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  RefreshCcw,
  GitBranch,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Network,
  Download,
  Search,
  Bot,
  Globe,
  Settings,
  Eye,
  PlayCircle,
} from "lucide-react"

interface AgentAction {
  id: string
  agentId: string
  timestamp: number
  interactionType: "test" | "query" | "response" | "evaluation" | "governance" | "deployment"
  prompt?: string
  response?: string
  responseTime?: number
  tokenUsage?: {
    prompt: number
    completion: number
    total: number
  }
  evaluationScores?: {
    relevance?: number
    accuracy?: number
    safety?: number
    overall?: number
  }
  decisions?: any[]
  toolCalls?: any[]
  dbQueries?: any[]
  parentInteractionId?: string
  sessionId?: string
  status: "success" | "error" | "warning" | "pending"
  metadata?: Record<string, any>
}

interface LineageNode {
  id: string
  agentId: string
  action: AgentAction
  children: LineageNode[]
  depth: number
  x: number
  y: number
}

interface LineageConnection {
  from: string
  to: string
  type: "parent-child" | "session" | "tool-call" | "db-query"
  strength: number
}

export function AgentLineageDisplay() {
  const [actions, setActions] = useState<AgentAction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [agentFilter, setAgentFilter] = useState<string>("all")
  const [timeFilter, setTimeFilter] = useState<string>("24h")
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null)
  const [viewMode, setViewMode] = useState<"tree" | "timeline" | "network">("tree")

  const loadLineageData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Load from lineage_mapping table
      const lineageRes = await fetch("/api/lineage/actions", { cache: "no-store" })
      if (!lineageRes.ok) throw new Error("Failed to load lineage data")

      const lineageData = await lineageRes.json()

      // Load from audit logs for additional context
      const auditRes = await fetch("/api/audit-logs?limit=500", { cache: "no-store" })
      const auditData = auditRes.ok ? await auditRes.json() : { data: [] }

      // Combine and transform data
      const combinedActions: AgentAction[] = [
        ...lineageData.data.map((item: any) => ({
          id: item.id,
          agentId: item.agent_id || "unknown",
          timestamp: new Date(item.created_at).getTime(),
          interactionType: item.interaction_type || "query",
          prompt: item.prompt,
          response: item.response,
          responseTime: item.response_time,
          tokenUsage: item.token_usage,
          evaluationScores: item.evaluation_scores,
          decisions: item.decisions,
          toolCalls: item.tool_calls,
          dbQueries: item.db_queries,
          parentInteractionId: item.parent_interaction_id,
          sessionId: item.session_id,
          status: item.response ? "success" : "pending",
          metadata: item.metadata || {},
        })),
        ...(auditData.data?.map((item: any) => ({
          id: `audit-${item.id}`,
          agentId: item.resource_id || "system",
          timestamp: new Date(item.timestamp).getTime(),
          interactionType: "governance",
          prompt: item.action,
          response: JSON.stringify(item.details),
          status: item.details?.status || "success",
          metadata: item.details || {},
        })) || []),
      ]

      setActions(combinedActions.sort((a, b) => b.timestamp - a.timestamp))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load lineage data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLineageData()
  }, [loadLineageData])

  // Filter actions based on search and filters
  const filteredActions = useMemo(() => {
    let filtered = actions

    // Time filter
    const now = Date.now()
    const timeMs =
      {
        "1h": 60 * 60 * 1000,
        "24h": 24 * 60 * 60 * 1000,
        "7d": 7 * 24 * 60 * 60 * 1000,
        "30d": 30 * 24 * 60 * 60 * 1000,
        all: Number.POSITIVE_INFINITY,
      }[timeFilter] || 24 * 60 * 60 * 1000

    filtered = filtered.filter((action) => now - action.timestamp <= timeMs)

    // Agent filter
    if (agentFilter !== "all") {
      filtered = filtered.filter((action) => action.agentId === agentFilter)
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (action) =>
          action.agentId.toLowerCase().includes(term) ||
          action.prompt?.toLowerCase().includes(term) ||
          action.response?.toLowerCase().includes(term) ||
          action.interactionType.toLowerCase().includes(term),
      )
    }

    return filtered
  }, [actions, searchTerm, agentFilter, timeFilter])

  // Build lineage tree structure
  const lineageTree = useMemo(() => {
    const nodeMap = new Map<string, LineageNode>()
    const rootNodes: LineageNode[] = []

    // Create nodes
    filteredActions.forEach((action) => {
      const node: LineageNode = {
        id: action.id,
        agentId: action.agentId,
        action,
        children: [],
        depth: 0,
        x: 0,
        y: 0,
      }
      nodeMap.set(action.id, node)
    })

    // Build parent-child relationships
    filteredActions.forEach((action) => {
      const node = nodeMap.get(action.id)
      if (!node) return

      if (action.parentInteractionId) {
        const parent = nodeMap.get(action.parentInteractionId)
        if (parent) {
          parent.children.push(node)
          node.depth = parent.depth + 1
        } else {
          rootNodes.push(node)
        }
      } else {
        rootNodes.push(node)
      }
    })

    // Calculate positions for tree layout
    let yOffset = 0
    const calculatePositions = (nodes: LineageNode[], depth = 0) => {
      nodes.forEach((node) => {
        node.x = depth * 300
        node.y = yOffset * 80
        yOffset++
        if (node.children.length > 0) {
          calculatePositions(node.children, depth + 1)
        }
      })
    }
    calculatePositions(rootNodes)

    return rootNodes
  }, [filteredActions])

  // Get unique agents for filter
  const uniqueAgents = useMemo(() => {
    const agents = new Set(actions.map((a) => a.agentId))
    return Array.from(agents).sort()
  }, [actions])

  // Get lineage connections
  const connections = useMemo(() => {
    const conns: LineageConnection[] = []

    filteredActions.forEach((action) => {
      if (action.parentInteractionId) {
        conns.push({
          from: action.parentInteractionId,
          to: action.id,
          type: "parent-child",
          strength: 1.0,
        })
      }

      // Session-based connections
      const sessionActions = filteredActions.filter((a) => a.sessionId === action.sessionId && a.id !== action.id)
      sessionActions.forEach((related) => {
        conns.push({
          from: action.id,
          to: related.id,
          type: "session",
          strength: 0.5,
        })
      })
    })

    return conns
  }, [filteredActions])

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case "test":
        return <PlayCircle className="h-4 w-4" />
      case "query":
        return <Search className="h-4 w-4" />
      case "response":
        return <ArrowRight className="h-4 w-4" />
      case "evaluation":
        return <Eye className="h-4 w-4" />
      case "governance":
        return <Settings className="h-4 w-4" />
      case "deployment":
        return <Globe className="h-4 w-4" />
      default:
        return <Activity className="h-4 w-4" />
    }
  }

  const exportLineage = () => {
    const data = {
      actions: filteredActions,
      connections,
      metadata: {
        exportTime: new Date().toISOString(),
        totalActions: filteredActions.length,
        uniqueAgents: uniqueAgents.length,
        timeRange: timeFilter,
      },
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `agent-lineage-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const TreeNode = ({ node, isLast = false }: { node: LineageNode; isLast?: boolean }) => (
    <div className="relative">
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
          selectedAction?.id === node.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
        }`}
        onClick={() => setSelectedAction(node.action)}
      >
        <div className="flex items-center gap-2">
          {getStatusIcon(node.action.status)}
          {getInteractionIcon(node.action.interactionType)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">
              <Bot className="h-3 w-3 mr-1" />
              {node.agentId}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {node.action.interactionType}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatTimestamp(node.action.timestamp)}</span>
          </div>

          <div className="text-sm font-medium truncate">
            {node.action.prompt || node.action.response || "No description"}
          </div>

          {node.action.responseTime && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              {node.action.responseTime}ms
            </div>
          )}
        </div>

        {node.children.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {node.children.length} child{node.children.length !== 1 ? "ren" : ""}
          </Badge>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="ml-6 mt-2 border-l-2 border-muted pl-4 space-y-2">
          {node.children.map((child, index) => (
            <TreeNode key={child.id} node={child} isLast={index === node.children.length - 1} />
          ))}
        </div>
      )}
    </div>
  )

  const TimelineView = () => (
    <div className="space-y-4">
      {filteredActions.map((action, index) => (
        <div key={action.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full ${
                action.status === "success"
                  ? "bg-green-500"
                  : action.status === "error"
                    ? "bg-red-500"
                    : action.status === "warning"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
              }`}
            />
            {index < filteredActions.length - 1 && <div className="w-0.5 h-12 bg-border mt-2" />}
          </div>

          <div
            className={`flex-1 p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
              selectedAction?.id === action.id ? "bg-primary/10 border-primary" : "bg-card hover:bg-muted/50"
            }`}
            onClick={() => setSelectedAction(action)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Bot className="h-3 w-3 mr-1" />
                  {action.agentId}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {action.interactionType}
                </Badge>
              </div>
              <span className="text-sm text-muted-foreground">{formatTimestamp(action.timestamp)}</span>
            </div>

            <div className="text-sm">
              {action.prompt && (
                <div className="mb-2">
                  <span className="font-medium">Prompt:</span> {action.prompt.substring(0, 100)}...
                </div>
              )}
              {action.response && (
                <div>
                  <span className="font-medium">Response:</span> {action.response.substring(0, 100)}...
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Agent Action Lineage</h2>
          <p className="text-sm text-muted-foreground">Visualize the flow and connections between agent interactions</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadLineageData} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportLineage}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search actions, agents, or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All agents</SelectItem>
                {uniqueAgents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last hour</SelectItem>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-semibold">{filteredActions.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total Actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-semibold">{uniqueAgents.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active Agents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-semibold">{connections.length}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Connections</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-2xl font-semibold">
                {filteredActions.filter((a) => a.status === "success").length}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Successful</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lineage Visualization */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Lineage Visualization
                </CardTitle>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
                  <TabsList>
                    <TabsTrigger value="tree">Tree</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {viewMode === "tree" ? (
                  <div className="space-y-4">
                    {lineageTree.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No lineage data found</p>
                        <p className="text-sm">Try adjusting your filters or refresh the data</p>
                      </div>
                    ) : (
                      lineageTree.map((node) => <TreeNode key={node.id} node={node} />)
                    )}
                  </div>
                ) : (
                  <TimelineView />
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Action Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Action Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAction ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedAction.status)}
                    <Badge variant="outline">
                      <Bot className="h-3 w-3 mr-1" />
                      {selectedAction.agentId}
                    </Badge>
                    <Badge variant="secondary" className="capitalize">
                      {selectedAction.interactionType}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-sm font-medium mb-2">Timestamp</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedAction.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {selectedAction.prompt && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Prompt</h4>
                      <div className="text-sm bg-muted p-3 rounded-md">{selectedAction.prompt}</div>
                    </div>
                  )}

                  {selectedAction.response && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Response</h4>
                      <div className="text-sm bg-muted p-3 rounded-md max-h-32 overflow-y-auto">
                        {selectedAction.response}
                      </div>
                    </div>
                  )}

                  {selectedAction.responseTime && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Performance</h4>
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4" />
                        {selectedAction.responseTime}ms response time
                      </div>
                    </div>
                  )}

                  {selectedAction.tokenUsage && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Token Usage</h4>
                      <div className="text-sm space-y-1">
                        <div>Prompt: {selectedAction.tokenUsage.prompt}</div>
                        <div>Completion: {selectedAction.tokenUsage.completion}</div>
                        <div>Total: {selectedAction.tokenUsage.total}</div>
                      </div>
                    </div>
                  )}

                  {selectedAction.evaluationScores && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Evaluation Scores</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedAction.evaluationScores).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="capitalize">{key}:</span>
                            <span>{typeof value === "number" ? value.toFixed(2) : value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAction.sessionId && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Session ID</h4>
                      <p className="text-sm text-muted-foreground font-mono">{selectedAction.sessionId}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select an action to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
