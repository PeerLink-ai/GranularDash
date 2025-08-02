"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Bot, Brain, Code, Zap, Activity, Plus } from "lucide-react"
import { AgentDetailsModal } from "./agent-details-modal"
import { AgentTestModal } from "./agent-test-modal"

const allAgents = {
  "openai-gpt4o-001": {
    id: "openai-gpt4o-001",
    name: "GPT-4o Enterprise",
    provider: "OpenAI",
    model: "gpt-4o",
    status: "active",
    endpoint: "https://api.openai.com/v1/chat/completions",
    connectedAt: "2024-01-15T10:30:00Z",
    lastActive: "2 hours ago",
    usage: {
      requests: 1247,
      tokensUsed: 45230,
      estimatedCost: 12.45,
    },
  },
  "anthropic-claude3-001": {
    id: "anthropic-claude3-001",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    model: "claude-3-opus",
    status: "active",
    endpoint: "https://api.anthropic.com/v1/messages",
    connectedAt: "2024-01-14T15:20:00Z",
    lastActive: "1 hour ago",
    usage: {
      requests: 892,
      tokensUsed: 32100,
      estimatedCost: 8.9,
    },
  },
  "groq-llama3-001": {
    id: "groq-llama3-001",
    name: "Llama 3 70B",
    provider: "Groq",
    model: "llama3-70b",
    status: "inactive",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    connectedAt: "2024-01-13T09:15:00Z",
    lastActive: "1 day ago",
    usage: {
      requests: 456,
      tokensUsed: 18900,
      estimatedCost: 2.3,
    },
  },
  "replit-agent-001": {
    id: "replit-agent-001",
    name: "Replit Agent",
    provider: "Replit",
    model: "replit-agent",
    status: "active",
    endpoint: "https://api.replit.com/v1/agents",
    connectedAt: "2024-01-12T14:45:00Z",
    lastActive: "30 minutes ago",
    usage: {
      requests: 234,
      tokensUsed: 12500,
      estimatedCost: 1.8,
    },
  },
}

export function AgentList() {
  const { user } = useAuth()
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)

  useEffect(() => {
    loadAgents()
  }, [user])

  const loadAgents = async () => {
    if (!user) return

    try {
      // Filter agents based on user's connected agents
      const userAgents = user.connectedAgents.map((id) => allAgents[id]).filter(Boolean)

      setAgents(userAgents)
    } catch (error) {
      console.error("Failed to load agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return Brain
      case "anthropic":
        return Bot
      case "replit":
        return Code
      case "groq":
        return Zap
      default:
        return Bot
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "testing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const handleViewDetails = (agent) => {
    setSelectedAgent(agent)
    setIsDetailsModalOpen(true)
  }

  const handleTestAgent = (agent) => {
    setSelectedAgent(agent)
    setIsTestModalOpen(true)
  }

  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active"
      setAgents(agents.map((agent) => (agent.id === agentId ? { ...agent, status: newStatus } : agent)))
    } catch (error) {
      console.error("Failed to toggle agent status:", error)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to disconnect this agent?")) return

    try {
      setAgents(agents.filter((agent) => agent.id !== agentId))
    } catch (error) {
      console.error("Failed to delete agent:", error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents connected</h3>
            <p className="text-muted-foreground mb-4">
              Connect your first AI agent to get started with automated governance and monitoring.
            </p>
            <Button onClick={() => window.location.reload()}>
              <Plus className="mr-2 h-4 w-4" />
              Connect Agent
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">Connected Agents ({agents.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={loadAgents}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((agent) => {
                  const ProviderIcon = getProviderIcon(agent.provider)
                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <ProviderIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium">{agent.name}</div>
                            <div className="text-sm text-muted-foreground">{agent.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{agent.provider}</Badge>
                      </TableCell>
                      <TableCell>{agent.model}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Activity className="h-3 w-3" />
                          <span className="text-sm">{agent.usage?.requests || 0} requests</span>
                        </div>
                      </TableCell>
                      <TableCell>{agent.lastActive || "Never"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(agent)}>View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleTestAgent(agent)}>Test Agent</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(agent.id, agent.status)}>
                              {agent.status === "active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteAgent(agent.id)} className="text-red-600">
                              Disconnect
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {selectedAgent && (
        <>
          <AgentDetailsModal isOpen={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen} agent={selectedAgent} />
          <AgentTestModal isOpen={isTestModalOpen} onOpenChange={setIsTestModalOpen} agent={selectedAgent} />
        </>
      )}
    </>
  )
}
