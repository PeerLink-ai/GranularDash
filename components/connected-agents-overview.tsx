"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Brain, Code, Zap, Plus, ArrowRight } from "lucide-react"
import Link from "next/link"

const agentDetails = {
  "openai-gpt4o-001": {
    name: "GPT-4o Enterprise",
    provider: "OpenAI",
    model: "gpt-4o",
    icon: Brain,
    status: "active",
    usage: "1,247 requests today",
  },
  "anthropic-claude3-001": {
    name: "Claude 3 Opus",
    provider: "Anthropic",
    model: "claude-3-opus",
    icon: Bot,
    status: "active",
    usage: "892 requests today",
  },
  "groq-llama3-001": {
    name: "Llama 3 70B",
    provider: "Groq",
    model: "llama3-70b",
    icon: Zap,
    status: "inactive",
    usage: "456 requests today",
  },
  "replit-agent-001": {
    name: "Replit Agent",
    provider: "Replit",
    model: "replit-agent",
    icon: Code,
    status: "active",
    usage: "234 requests today",
  },
}

export function ConnectedAgentsOverview() {
  const { user } = useAuth()

  if (!user) return null

  const connectedAgents = user.connectedAgents
    .map((id) => ({
      id,
      ...agentDetails[id],
    }))
    .filter(Boolean)

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
        {connectedAgents.length === 0 ? (
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
              const Icon = agent.icon
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
                    <div className="text-xs text-muted-foreground">{agent.usage}</div>
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
