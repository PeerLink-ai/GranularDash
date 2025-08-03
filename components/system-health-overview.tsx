"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Activity } from "lucide-react"

export function SystemHealthOverview() {
  const [agentStats, setAgentStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    agentsWithAlerts: 0,
    agentsInReview: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAgentStats()
  }, [])

  const loadAgentStats = async () => {
    try {
      const response = await fetch("/api/agents")
      if (response.ok) {
        const data = await response.json()
        const agents = data.agents || []

        setAgentStats({
          totalAgents: agents.length,
          activeAgents: agents.filter((a) => a.status === "active").length,
          agentsWithAlerts: agents.filter((a) => a.status === "warning" || a.usage?.errorRate > 5).length,
          agentsInReview: agents.filter((a) => a.status === "inactive" || a.status === "testing").length,
        })
      }
    } catch (error) {
      console.error("Failed to load agent stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Health Overview</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health Overview</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{agentStats.activeAgents}</div>
        <p className="text-xs text-muted-foreground">
          {agentStats.activeAgents} of {agentStats.totalAgents} agents active
        </p>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Agents</span>
            <span className="text-sm font-medium">{agentStats.totalAgents}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Active Agents</span>
            <span className="text-sm font-medium text-green-600">{agentStats.activeAgents}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Agents with Alerts</span>
            <span className="text-sm font-medium text-yellow-600">{agentStats.agentsWithAlerts}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Agents in Review</span>
            <span className="text-sm font-medium text-red-600">{agentStats.agentsInReview}</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => (window.location.href = "/agent-management")}>
            <PlusCircle className="mr-2 h-4 w-4" /> Manage
          </Button>
          <Button size="sm" variant="outline" onClick={loadAgentStats}>
            <Activity className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
