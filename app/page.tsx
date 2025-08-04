"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Activity, Shield, Users, AlertTriangle, Plus, Eye, Settings } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { ConnectAgentModal } from "@/components/connect-agent-modal"
import { ViewAgentModal } from "@/components/view-agent-modal"

interface Agent {
  id: string
  name: string
  type: string
  status: string
  last_active: string
  health_status: string
}

interface Stats {
  totalAgents: number
  activeAgents: number
  totalViolations: number
  criticalViolations: number
}

export default function Dashboard() {
  const { user } = useAuth()
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<Stats>({
    totalAgents: 0,
    activeAgents: 0,
    totalViolations: 0,
    criticalViolations: 0,
  })
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch agents
      const agentsResponse = await fetch("/api/agents")
      if (agentsResponse.ok) {
        const agentsData = await agentsResponse.json()
        setAgents(agentsData.agents || [])
      }

      // Fetch stats
      const statsResponse = await fetch("/api/dashboard/stats")
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAgentConnected = () => {
    fetchDashboardData()
    setShowConnectModal(false)
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Agent Governance Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and govern your AI agents with comprehensive compliance oversight
          </p>
        </div>
        <Button onClick={() => setShowConnectModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Connect Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">Connected AI agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViolations}</div>
            <p className="text-xs text-muted-foreground">Total violations detected</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.criticalViolations}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Connected Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Agents</CardTitle>
          <CardDescription>Manage and monitor your connected AI agents</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading agents...</div>
          ) : agents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No agents connected yet</p>
              <Button onClick={() => setShowConnectModal(true)}>Connect Your First Agent</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.map((agent) => (
                <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h3 className="font-medium">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.type}</p>
                    </div>
                    <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                    <Badge variant={agent.health_status === "healthy" ? "default" : "destructive"}>
                      {agent.health_status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedAgent(agent)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <ConnectAgentModal
        open={showConnectModal}
        onOpenChange={setShowConnectModal}
        onAgentConnected={handleAgentConnected}
      />

      {selectedAgent && (
        <ViewAgentModal agent={selectedAgent} open={!!selectedAgent} onOpenChange={() => setSelectedAgent(null)} />
      )}
    </div>
  )
}
