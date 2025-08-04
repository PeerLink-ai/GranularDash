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

interface Agent {
  id: string
  agent_id: string
  name: string
  provider: string
  model: string
  status: string
  endpoint: string
  connected_at: string
  last_active?: string
  usage_requests: number
  usage_tokens_used: number
  usage_estimated_cost: number
}

export function AgentList() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAgents()
    }
  }, [user])

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error)
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

  const formatLastActive = (lastActive?: string) => {
    if (!lastActive) return "Never"

    const date = new Date(lastActive)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`
    }
  }

  const handleViewDetails = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsDetailsModalOpen(true)
  }

  const handleTestAgent = (agent: Agent) => {
    setSelectedAgent(agent)
    setIsTestModalOpen(true)
  }

  const handleToggleStatus = async (agentId: string, currentStatus: string) => {
    try {
      setLoading(true)
      const newStatus = currentStatus === "active" ? "inactive" : "active"

      const response = await fetch(`/api/agents/${agentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchAgents()
      }
    } catch (error) {
      console.error("Failed to toggle agent status:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm("Are you sure you want to disconnect this agent?")) return

    try {
      setLoading(true)
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchAgents()
      }
    } catch (error) {
      console.error("Failed to delete agent:", error)
    } finally {
      setLoading(false)
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
            <Button onClick={() => (window.location.href = "/agent-management")}>
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
          <Button variant="outline" size="sm" onClick={fetchAgents}>
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
                            <div className="text-sm text-muted-foreground">{agent.agent_id}</div>
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
                          <span className="text-sm">{agent.usage_requests || 0} requests</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatLastActive(agent.last_active)}</TableCell>
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
                            <DropdownMenuItem onClick={() => handleToggleStatus(agent.agent_id, agent.status)}>
                              {agent.status === "active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteAgent(agent.agent_id)}
                              className="text-red-600"
                            >
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
