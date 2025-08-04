"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Activity, AlertCircle, CheckCircle } from "lucide-react"
import { ConnectAgentModal } from "./connect-agent-modal"
import { useAuth } from "@/contexts/auth-context"

interface ConnectedAgent {
  user_id: string
  agent_id: string
  name: string
  provider: string
  model: string
  status: "active" | "inactive" | "error"
  endpoint: string
  connected_at: string
  last_active?: string
  usage_requests: number
  usage_tokens_used: number
  usage_estimated_cost: number
}

export function ConnectedAgentsOverview() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<ConnectedAgent[]>([])
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

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
        setAgents(data)
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "inactive":
        return <Activity className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      case "inactive":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading agents...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold">Connected Agents</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setIsConnectModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Agent
          </Button>
        </CardHeader>
        <CardContent>
          {agents.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">No agents connected yet</div>
              <Button variant="outline" onClick={() => setIsConnectModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Connect Your First Agent
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.agent_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(agent.status)}
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.provider} • {agent.model}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                    <div className="text-sm text-muted-foreground">{agent.usage_requests} requests</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConnectAgentModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onAgentConnected={fetchAgents}
      />
    </>
  )
}
