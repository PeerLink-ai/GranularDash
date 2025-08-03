"use client"

import { useAuth, type Agent } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Brain, Code, Zap, Plus, ArrowRight, Loader2, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

// Map provider names to Lucide icons
const providerIcons = {
  OpenAI: Brain,
  Anthropic: Bot,
  Groq: Zap,
  Replit: Code,
}

export function ConnectedAgentsOverview() {
  const { user } = useAuth()
  const [connectedAgents, setConnectedAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
        setConnectedAgents(data.agents)
      } else {
        setError("Failed to load agents.")
        setConnectedAgents([])
      }
    } catch (err) {
      setError("Error fetching agents.")
      setConnectedAgents([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    // Optionally refetch agents periodically or on specific events
    const interval = setInterval(fetchAgents, 30000) // Refetch every 30 seconds
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const hasPermission = user.permissions.includes("manage_agents")

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Connected Agents</CardTitle>
          <CardDescription>
            {connectedAgents.length > 0
              ? `${connectedAgents.length} AI agents connected and monitored`
              : "No agents connected yet"}
          </CardDescription>
        </div>
        {hasPermission && (
          <Link href="/agent-management">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Connect Agent
            </Button>
          </Link>
        )}
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
        ) : connectedAgents.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents connected</h3>
            <p className="text-muted-foreground mb-4">
              {hasPermission
                ? "Connect your first AI agent to start monitoring and governance."
                : "Contact your administrator to connect AI agents."}
            </p>
            {hasPermission && (
              <Link href="/agent-management">
                <Button>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {connectedAgents.map((agent) => {
              const Icon = providerIcons[agent.provider as keyof typeof providerIcons] || Bot
              return (
                <div key={agent.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{agent.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {agent.provider} • {agent.model}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={agent.status === "active" ? "default" : "secondary"} className="mb-1">
                      {agent.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">{agent.usage.requests} requests today</div>
                  </div>
                </div>
              )
            })}

            {hasPermission && (
              <Link href="/agent-management">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Agents
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
