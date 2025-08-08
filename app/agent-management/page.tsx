"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AgentList } from "@/components/agent-list"

interface Agent {
  id: string
  name: string
  type: string
  status: "active" | "inactive" | "error"
  endpoint: string
  version: string
  description: string
  connected_at: string
  last_activity?: string
}

interface AgentStats {
  total: number
  active: number
  inactive: number
  error: number
  totalRequests: number
  healthPercentage: number
}

export default function AgentManagementPage() {
  const [stats, setStats] = useState<AgentStats>({
    total: 0,
    active: 0,
    inactive: 0,
    error: 0,
    totalRequests: 0,
    healthPercentage: 100
  })
  const [isLoading, setIsLoading] = useState(true)

  const fetchAgentStats = async () => {
    try {
      const response = await fetch("/api/agents")
      if (!response.ok) {
        throw new Error("Failed to fetch agents")
      }
      const data = await response.json()
      const agents: Agent[] = data.agents || []
      
      const total = agents.length
      const active = agents.filter(agent => agent.status === "active").length
      const inactive = agents.filter(agent => agent.status === "inactive").length
      const error = agents.filter(agent => agent.status === "error").length
      
      // Calculate health percentage (active agents / total agents * 100)
      const healthPercentage = total > 0 ? Math.round((active / total) * 100) : 100
      
      // Mock total requests - in a real app, this would come from analytics
      const totalRequests = agents.reduce((sum, agent) => {
        // Mock calculation based on agent activity
        return sum + (agent.status === "active" ? Math.floor(Math.random() * 1000) : 0)
      }, 0)

      setStats({
        total,
        active,
        inactive,
        error,
        totalRequests,
        healthPercentage
      })
    } catch (error) {
      console.error("Error fetching agent stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgentStats()
    
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchAgentStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const getHealthStatusColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getHealthStatusText = (percentage: number) => {
    if (percentage >= 80) return "Excellent"
    if (percentage >= 60) return "Good"
    if (percentage >= 40) return "Fair"
    return "Poor"
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Agent Management</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">🤖</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.total === 0 ? "No agents connected" : `${stats.total} agent${stats.total !== 1 ? 's' : ''} connected`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">✅</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.active}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.active === 0 ? "No active agents" : "Currently running"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">📊</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : stats.totalRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <div className="h-4 w-4 text-muted-foreground">💚</div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthStatusColor(stats.healthPercentage)}`}>
              {isLoading ? "..." : `${stats.healthPercentage}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {getHealthStatusText(stats.healthPercentage)}
            </p>
          </CardContent>
        </Card>
      </div>

      <AgentList />
    </div>
  )
}
