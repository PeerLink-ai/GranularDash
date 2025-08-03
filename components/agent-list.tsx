"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Play, Pause, Trash, Eye, Loader2, AlertTriangle, Brain, Bot, Zap, Code } from "lucide-react"
import { AgentDetailsModal } from "@/components/agent-details-modal"
import { AgentTestModal } from "@/components/agent-test-modal"
import { useToast } from "@/components/ui/use-toast"
import { useAuth, type Agent } from "@/contexts/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Map provider names to Lucide icons
const providerIcons = {
  OpenAI: Brain,
  Anthropic: Bot,
  Groq: Zap,
  Replit: Code,
}

export function AgentList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isTestModalOpen, setIsTestModalOpen] = useState(false)

  const fetchAgents = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/agents", {
        headers: {
          "X-User-ID": user.id, // Pass user ID for server-side filtering
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents)
      } else {
        setError("Failed to load agents.")
        setAgents([])
      }
    } catch (err) {
      setError("Error fetching agents.")
      setAgents([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    // Listen for custom event to refetch agents after connection
    window.addEventListener("agentConnected", fetchAgents)
    return () => {
      window.removeEventListener("agentConnected", fetchAgents)
    }
  }, [user])

  const handleStatusChange = async (agentId: string, newStatus: "active" | "inactive" | "paused") => {
    if (!user || !user.permissions.includes("manage_agents")) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to change agent status.",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/agents/${agentId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id, // Pass user ID
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Agent status changed to ${newStatus}.`,
        })
        fetchAgents() // Refresh the list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update agent status.")
      }
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAgent = async (agentId: string) => {
    if (!user || !user.permissions.includes("manage_agents")) {
      toast({
        title: "Permission Denied",
        description: "You do not have permission to delete agents.",
        variant: "destructive",
      })
      return
    }
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: "DELETE",
        headers: {
          "X-User-ID": user.id, // Pass user ID
        },
      })

      if (response.ok) {
        toast({
          title: "Agent Deleted",
          description: "Agent has been successfully removed.",
        })
        fetchAgents() // Refresh the list
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete agent.")
      }
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
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

  const canManageAgents = user?.permissions.includes("manage_agents")
  const canTestAgents = user?.permissions.includes("test_agents")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Connected AI Agents</CardTitle>
        <CardDescription>Manage and monitor your integrated AI models.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading agents</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={fetchAgents} className="mt-4">
              Retry
            </Button>
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents connected</h3>
            <p className="text-muted-foreground mb-4">
              {canManageAgents
                ? "Connect your first AI agent to start monitoring and governance."
                : "You do not have permission to connect agents. Contact your administrator."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => {
                const Icon = providerIcons[agent.provider as keyof typeof providerIcons] || Bot
                return (
                  <TableRow key={agent.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {agent.name}
                    </TableCell>
                    <TableCell>{agent.provider}</TableCell>
                    <TableCell>{agent.model}</TableCell>
                    <TableCell>
                      <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                    </TableCell>
                    <TableCell>{agent.lastActive}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(agent)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          {canTestAgents && (
                            <DropdownMenuItem onClick={() => handleTestAgent(agent)}>
                              <Play className="mr-2 h-4 w-4" /> Test Agent
                            </DropdownMenuItem>
                          )}
                          {canManageAgents && (
                            <>
                              {agent.status === "active" ? (
                                <DropdownMenuItem onClick={() => handleStatusChange(agent.id, "paused")}>
                                  <Pause className="mr-2 h-4 w-4" /> Pause
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleStatusChange(agent.id, "active")}>
                                  <Play className="mr-2 h-4 w-4" /> Activate
                                </DropdownMenuItem>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                    <Trash className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This action cannot be undone. This will permanently delete the{" "}
                                      <span className="font-semibold">{agent.name}</span> agent and remove its data from
                                      our servers.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteAgent(agent.id)}
                                      className="bg-red-600 text-white hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {selectedAgent && (
        <>
          <AgentDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            agent={selectedAgent}
          />
          <AgentTestModal isOpen={isTestModalOpen} onClose={() => setIsTestModalOpen(false)} agent={selectedAgent} />
        </>
      )}
    </Card>
  )
}
