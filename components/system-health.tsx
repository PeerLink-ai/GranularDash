"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, AlertTriangle, XCircle, Server, Clock, Zap, Loader2, Bot } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"

interface SystemHealthMetrics {
  overallStatus: "healthy" | "degraded" | "critical"
  uptimePercentage: number
  avgResponseTimeMs: number
  activeAgents: number
  lastUpdated: string
}

export function SystemHealth() {
  const { user } = useAuth()
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHealthMetrics = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching system health metrics
        // In a real app, this would be an API call to a backend service
        const mockMetrics: SystemHealthMetrics = {
          overallStatus: "healthy",
          uptimePercentage: 99.9,
          avgResponseTimeMs: 150,
          activeAgents: 3, // This should ideally come from connected agents count
          lastUpdated: new Date().toLocaleTimeString(),
        }

        // Adjust activeAgents based on user's connected agents (simulated)
        const agentsResponse = await fetch("/api/agents", {
          headers: {
            "X-User-ID": user.id,
          },
        })
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json()
          mockMetrics.activeAgents = agentsData.agents.filter((agent: any) => agent.status === "active").length
        }

        setHealthMetrics(mockMetrics)
      } catch (err) {
        setError("Failed to load system health.")
        setHealthMetrics(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHealthMetrics()
    const interval = setInterval(fetchHealthMetrics, 60000) // Refetch every minute
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "critical":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Server className="h-5 w-5 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardDescription>Overall status and performance of your AI governance platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading system health...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading system health</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : healthMetrics ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(healthMetrics.overallStatus)}
                <div>
                  <p className="font-medium">Overall Status</p>
                  <p className="text-sm text-muted-foreground capitalize">{healthMetrics.overallStatus}</p>
                </div>
              </div>
              <Badge variant={healthMetrics.overallStatus === "healthy" ? "default" : "destructive"}>
                {healthMetrics.overallStatus.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 rounded-md border p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Uptime</p>
                  <p className="text-xs text-muted-foreground">{healthMetrics.uptimePercentage}%</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-md border p-3">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Avg. Response Time</p>
                  <p className="text-xs text-muted-foreground">{healthMetrics.avgResponseTimeMs}ms</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-md border p-3">
                <Bot className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Active Agents</p>
                  <p className="text-xs text-muted-foreground">{healthMetrics.activeAgents}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-md border p-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-xs text-muted-foreground">{healthMetrics.lastUpdated}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
