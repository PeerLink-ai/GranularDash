"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Bot, Clock, Zap, MessageSquare, Activity, ChevronRight, Filter, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DataModelLineageProps {
  onOpenDatasetVersioning: () => void
  onOpenTransformationSteps: () => void
  onOpenModelVersionTracking: () => void
}

interface SDKLog {
  id: string
  agent_id: string
  type: string
  level: string
  timestamp: bigint
  created_at: string
  payload: {
    message?: string
    prompt?: string
    response?: string
    tokenUsage?: {
      prompt?: number
      completion?: number
      total?: number
    }
    responseTime?: number
    evaluation?: {
      overall?: number
      safety?: number
      relevance?: number
      coherence?: number
      factuality?: number
    }
    action?: string
    status?: string
    duration_ms?: number
    model?: string
    [key: string]: any
  }
}

interface AgentGroup {
  agentId: string
  logs: SDKLog[]
  totalLogs: number
  lastActivity: string
  avgResponseTime: number
  successRate: number
}

export function DataModelLineage({
  onOpenDatasetVersioning,
  onOpenTransformationSteps,
  onOpenModelVersionTracking,
}: DataModelLineageProps) {
  const [logs, setLogs] = React.useState<SDKLog[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [search, setSearch] = React.useState("")
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null)
  const [typeFilter, setTypeFilter] = React.useState<string>("all")

  const loadLineage = async () => {
    console.log("[v0] Loading lineage data from sdk_logs...")
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/lineage", { cache: "no-store" })

      if (!response.ok) {
        throw new Error(`Failed to fetch lineage data: ${response.status}`)
      }

      const data = await response.json()
      console.log("[v0] Received lineage data:", data)

      // Extract SDK logs from the lineage mapping data
      const sdkLogs = data.lineageMapping || []
      console.log("[v0] Processing", sdkLogs.length, "SDK logs")

      setLogs(sdkLogs)
    } catch (error) {
      console.error("[v0] Error loading lineage data:", error)
      setError(error instanceof Error ? error.message : "Failed to load lineage data")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadLineage()
  }, [])

  const agentGroups = React.useMemo((): AgentGroup[] => {
    const groups = new Map<string, SDKLog[]>()

    // Filter logs based on search and type
    const filteredLogs = logs.filter((log) => {
      const matchesSearch =
        search === "" ||
        log.agent_id.toLowerCase().includes(search.toLowerCase()) ||
        log.payload?.message?.toLowerCase().includes(search.toLowerCase()) ||
        log.payload?.prompt?.toLowerCase().includes(search.toLowerCase())

      const matchesType = typeFilter === "all" || log.type === typeFilter

      return matchesSearch && matchesType
    })

    // Group by agent_id
    filteredLogs.forEach((log) => {
      if (!groups.has(log.agent_id)) {
        groups.set(log.agent_id, [])
      }
      groups.get(log.agent_id)!.push(log)
    })

    // Convert to AgentGroup objects with stats
    return Array.from(groups.entries())
      .map(([agentId, agentLogs]) => {
        const sortedLogs = agentLogs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        const responseTimes = agentLogs
          .map((log) => log.payload?.responseTime || log.payload?.duration_ms)
          .filter(Boolean) as number[]

        const avgResponseTime =
          responseTimes.length > 0 ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length : 0

        const successCount = agentLogs.filter((log) => log.payload?.status === "success" || log.level === "info").length

        const successRate = agentLogs.length > 0 ? (successCount / agentLogs.length) * 100 : 0

        return {
          agentId,
          logs: sortedLogs,
          totalLogs: agentLogs.length,
          lastActivity: sortedLogs[0]?.created_at || "",
          avgResponseTime,
          successRate,
        }
      })
      .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
  }, [logs, search, typeFilter])

  // Get unique log types for filter
  const logTypes = React.useMemo(() => {
    const types = new Set(logs.map((log) => log.type))
    return Array.from(types).sort()
  }, [logs])

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "warn":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "playground_test":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "request":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inference":
        return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
      case "security":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "performance":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  if (loading) {
    return (
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Loading Agent Activity...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading lineage data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="shadow-sm border-gray-200 dark:border-gray-800">
        <CardHeader>
          <CardTitle className="text-red-600">Error Loading Lineage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={loadLineage} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border-gray-200 dark:border-gray-800">
      <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6" />
              Agent Activity Lineage
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Real-time agent activity organized by agent with detailed audit logs from SDK
            </CardDescription>
          </div>
          <Button onClick={loadLineage} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search agents, messages, or prompts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm"
            >
              <option value="all">All Types</option>
              {logTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <span>{agentGroups.length} agents</span>
          <span>{logs.length} total logs</span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={selectedAgent || "overview"} onValueChange={setSelectedAgent}>
          <div className="flex">
            <div className="w-80 border-r border-gray-200 dark:border-gray-800">
              <TabsList className="w-full justify-start p-0 h-auto bg-transparent">
                <div className="w-full">
                  <TabsTrigger
                    value="overview"
                    className="w-full justify-start p-4 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950"
                  >
                    <div className="flex items-center gap-3">
                      <Activity className="h-4 w-4" />
                      <span>Overview</span>
                    </div>
                  </TabsTrigger>
                  <Separator />
                  <ScrollArea className="h-[600px]">
                    {agentGroups.map((group) => (
                      <TabsTrigger
                        key={group.agentId}
                        value={group.agentId}
                        className="w-full justify-start p-4 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-950 border-b border-gray-100 dark:border-gray-800"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-medium truncate">{group.agentId}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {group.totalLogs} logs • {group.successRate.toFixed(0)}% success
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {group.avgResponseTime > 0 && `${formatDuration(group.avgResponseTime)} avg`}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TabsTrigger>
                    ))}
                  </ScrollArea>
                </div>
              </TabsList>
            </div>

            <div className="flex-1">
              <TabsContent value="overview" className="m-0">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Agent Activity Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agentGroups.slice(0, 6).map((group) => (
                      <Card
                        key={group.agentId}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedAgent(group.agentId)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="h-4 w-4" />
                            <span className="font-medium truncate">{group.agentId}</span>
                          </div>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Total Logs:</span>
                              <span>{group.totalLogs}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Success Rate:</span>
                              <span>{group.successRate.toFixed(0)}%</span>
                            </div>
                            {group.avgResponseTime > 0 && (
                              <div className="flex justify-between">
                                <span>Avg Response:</span>
                                <span>{formatDuration(group.avgResponseTime)}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Last Activity:</span>
                              <span>{new Date(group.lastActivity).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {agentGroups.map((group) => (
                <TabsContent key={group.agentId} value={group.agentId} className="m-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Bot className="h-5 w-5" />
                          {group.agentId}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {group.totalLogs} logs • {group.successRate.toFixed(0)}% success rate
                        </p>
                      </div>
                    </div>

                    <ScrollArea className="h-[500px]">
                      <div className="space-y-4">
                        {group.logs.map((log) => (
                          <Card key={log.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge className={cn("text-xs", getLevelColor(log.level))}>{log.level}</Badge>
                                  <Badge className={cn("text-xs", getTypeColor(log.type))}>{log.type}</Badge>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(log.created_at)}
                                </div>
                              </div>

                              {log.payload?.message && (
                                <div className="mb-3">
                                  <div className="text-sm font-medium mb-1">Message:</div>
                                  <div className="text-sm text-muted-foreground">{log.payload.message}</div>
                                </div>
                              )}

                              {log.payload?.prompt && (
                                <div className="mb-3">
                                  <div className="text-sm font-medium mb-1 flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    Prompt:
                                  </div>
                                  <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                    {log.payload.prompt.length > 200
                                      ? `${log.payload.prompt.substring(0, 200)}...`
                                      : log.payload.prompt}
                                  </div>
                                </div>
                              )}

                              {log.payload?.response && (
                                <div className="mb-3">
                                  <div className="text-sm font-medium mb-1">Response:</div>
                                  <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-2 rounded">
                                    {log.payload.response.length > 200
                                      ? `${log.payload.response.substring(0, 200)}...`
                                      : log.payload.response}
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                {log.payload?.responseTime && (
                                  <div className="flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    {formatDuration(log.payload.responseTime)}
                                  </div>
                                )}
                                {log.payload?.tokenUsage?.total && <div>{log.payload.tokenUsage.total} tokens</div>}
                                {log.payload?.status && (
                                  <Badge
                                    variant={log.payload.status === "success" ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {log.payload.status}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
