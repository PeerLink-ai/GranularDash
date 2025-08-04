"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Bot, Activity, AlertTriangle, CheckCircle } from "lucide-react"
import { ConnectedAgentsOverview } from "@/components/connected-agents-overview"
import { AgentList } from "@/components/agent-list"
import { IntegrationModal } from "@/components/integration-modal"

export default function AgentManagementPage() {
  const { user } = useAuth()
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false)
  const [agents, setAgents] = useState([])
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
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgentConnected = () => {
    fetchAgents()
    setIsIntegrationModalOpen(false)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  const activeAgents = agents.filter((agent) => agent.status === "active").length
  const totalAgents = agents.length
  const healthyAgents = agents.filter((agent) => agent.health_status === "healthy").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
          <p className="text-muted-foreground">
            Connect and manage your AI agents for automated governance and monitoring.
          </p>
        </div>
        <Button onClick={() => setIsIntegrationModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect Agent
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              {totalAgents === 0 ? "No agents connected" : "Connected to your organization"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAgents}</div>
            <p className="text-xs text-muted-foreground">
              {activeAgents === 0 ? "No active agents" : "Currently running"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthyAgents}</div>
            <p className="text-xs text-muted-foreground">
              {healthyAgents === 0 ? "No healthy agents" : "Agents running normally"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.filter((agent) => agent.health_status === "error").length}</div>
            <p className="text-xs text-muted-foreground">Agents requiring attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Agents Overview */}
      <ConnectedAgentsOverview />

      {/* Agent List */}
      <AgentList />

      {/* Integration Modal */}
      <IntegrationModal
        isOpen={isIntegrationModalOpen}
        onOpenChange={setIsIntegrationModalOpen}
        onAgentConnected={handleAgentConnected}
      />
    </div>
  )
}
