"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ConnectAgentModal } from "./connect-agent-modal"
import { useToast } from "@/hooks/use-toast"
import {
  Bot,
  Search,
  Grid3X3,
  List,
  Play,
  Pause,
  Settings,
  Trash2,
  MoreHorizontal,
  Activity,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Eye,
  Copy,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
} from "lucide-react"

interface Agent {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "error" | "deploying" | "paused"
  endpoint: string
  version: string
  description: string
  connected_at: string
  last_activity?: string
  metrics?: {
    requests: number
    latency: number
    errors: number
    uptime: number
    cpu: number
    memory: number
  }
  config?: {
    maxRequests: number
    timeout: number
    retries: number
    autoScale: boolean
  }
}

type ViewMode = "grid" | "list"
type SortBy = "name" | "status" | "activity" | "requests" | "uptime"

export function InteractiveAgentManagement() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortBy>("name")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const { toast } = useToast()

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      if (!response.ok) throw new Error("Failed to fetch agents")

      const data = await response.json()
      const agentsWithMetrics = (data.agents || []).map((agent: Agent) => ({
        ...agent,
        metrics: {
          requests: Math.floor(Math.random() * 10000),
          latency: Math.floor(Math.random() * 200) + 50,
          errors: Math.floor(Math.random() * 50),
          uptime: Math.floor(Math.random() * 100),
          cpu: Math.floor(Math.random() * 80) + 10,
          memory: Math.floor(Math.random() * 70) + 20,
        },
        config: {
          maxRequests: 1000,
          timeout: 30000,
          retries: 3,
          autoScale: true,
        },
      }))

      setAgents(agentsWithMetrics)
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast({
        title: "Error",
        description: "Failed to load agents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 30000)
    return () => clearInterval(interval)
  }, [])

  const filteredAndSortedAgents = useMemo(() => {
    const filtered = agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || agent.status === statusFilter
      const matchesType = typeFilter === "all" || agent.type === typeFilter

      return matchesSearch && matchesStatus && matchesType
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "status":
          return a.status.localeCompare(b.status)
        case "activity":
          return new Date(b.last_activity || 0).getTime() - new Date(a.last_activity || 0).getTime()
        case "requests":
          return (b.metrics?.requests || 0) - (a.metrics?.requests || 0)
        case "uptime":
          return (b.metrics?.uptime || 0) - (a.metrics?.uptime || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [agents, searchQuery, statusFilter, typeFilter, sortBy])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500"
      case "inactive":
        return "bg-slate-400"
      case "error":
        return "bg-red-500"
      case "deploying":
        return "bg-blue-500"
      case "paused":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "error":
        return "destructive"
      case "deploying":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleBulkAction = async (action: string) => {
    if (selectedAgents.length === 0) return

    try {
      const promises = selectedAgents.map((agentId) => fetch(`/api/agents/${agentId}/${action}`, { method: "POST" }))

      await Promise.all(promises)

      toast({
        title: "Success",
        description: `${action} applied to ${selectedAgents.length} agent(s)`,
      })

      setSelectedAgents([])
      fetchAgents()
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} selected agents`,
        variant: "destructive",
      })
    }
  }

  const AgentCard = ({ agent }: { agent: Agent }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 ring-1 ring-primary/20">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${getStatusColor(agent.status)}`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
              <p className="text-sm text-muted-foreground truncate">{agent.description}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSelectedAgent(agent)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setSelectedAgent(agent)
                  setShowConfigModal(true)
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                Configure
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                {agent.status === "active" ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant={getStatusBadgeVariant(agent.status)} className="capitalize">
            {agent.status}
          </Badge>
          <Badge variant="outline">{agent.type}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-muted-foreground">Requests:</span>
            <span className="font-medium">{agent.metrics?.requests.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Latency:</span>
            <span className="font-medium">{agent.metrics?.latency}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <span className="text-muted-foreground">Uptime:</span>
            <span className="font-medium">{agent.metrics?.uptime}%</span>
          </div>
          <div className="flex items-center gap-2">
            {agent.metrics?.errors === 0 ? (
              <CheckCircle className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-muted-foreground">Errors:</span>
            <span className="font-medium">{agent.metrics?.errors}</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">CPU Usage</span>
            <span className="font-medium">{agent.metrics?.cpu}%</span>
          </div>
          <Progress value={agent.metrics?.cpu} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Memory Usage</span>
            <span className="font-medium">{agent.metrics?.memory}%</span>
          </div>
          <Progress value={agent.metrics?.memory} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agent Management</h2>
          <p className="text-muted-foreground">Manage and monitor your AI agents with advanced controls</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowConnectModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect Agent
          </Button>
        </div>
      </div>

      {/* Advanced Filters and Search */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="chatbot">Chatbot</SelectItem>
                  <SelectItem value="classifier">Classifier</SelectItem>
                  <SelectItem value="generator">Generator</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="requests">Requests</SelectItem>
                  <SelectItem value="uptime">Uptime</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {selectedAgents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{selectedAgents.length} selected</span>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction("start")}>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleBulkAction("pause")}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                </div>
              )}

              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button variant="outline" size="sm" onClick={fetchAgents}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Grid/List */}
      {filteredAndSortedAgents.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="text-center py-12">
            <Bot className="mx-auto h-16 w-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-muted-foreground mb-4">
              {agents.length === 0
                ? "Connect your first AI agent to start monitoring and governing its behavior."
                : "Try adjusting your search or filter criteria."}
            </p>
            {agents.length === 0 && (
              <Button onClick={() => setShowConnectModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Connect Your First Agent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === "grid" ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
          {filteredAndSortedAgents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      )}

      {/* Agent Configuration Modal */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configure Agent: {selectedAgent?.name}</DialogTitle>
            <DialogDescription>Adjust performance settings and behavior parameters</DialogDescription>
          </DialogHeader>

          {selectedAgent && (
            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
                <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Max Requests per Hour</label>
                    <Slider
                      value={[selectedAgent.config?.maxRequests || 1000]}
                      onValueChange={(value) => {
                        // Handle config update
                      }}
                      max={10000}
                      step={100}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {selectedAgent.config?.maxRequests || 1000} requests/hour
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Request Timeout (ms)</label>
                    <Slider
                      value={[selectedAgent.config?.timeout || 30000]}
                      onValueChange={(value) => {
                        // Handle config update
                      }}
                      max={120000}
                      step={1000}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: {selectedAgent.config?.timeout || 30000}ms
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">Auto Scaling</label>
                      <p className="text-xs text-muted-foreground">Automatically scale based on demand</p>
                    </div>
                    <Switch
                      checked={selectedAgent.config?.autoScale || false}
                      onCheckedChange={(checked) => {
                        // Handle config update
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Security configuration options</p>
                  <p className="text-sm">Rate limiting, authentication, and access controls</p>
                </div>
              </TabsContent>

              <TabsContent value="monitoring" className="space-y-4">
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Monitoring and alerting settings</p>
                  <p className="text-sm">Configure thresholds and notification preferences</p>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <ConnectAgentModal open={showConnectModal} onOpenChange={setShowConnectModal} onAgentConnected={fetchAgents} />
    </div>
  )
}
