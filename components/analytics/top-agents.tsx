"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Agent {
  id: string
  name: string
  securityScore: number
  status: string
  lastActivity: string
}

export function TopAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopAgents = async () => {
      try {
        const response = await fetch("/api/analytics/top-agents")
        if (response.ok) {
          const data = await response.json()
          setAgents(data)
        }
      } catch (error) {
        console.error("Failed to fetch top agents:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTopAgents()
  }, [])

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Top Secure Agents</CardTitle>
        <CardDescription>Agents with highest security scores</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-9 w-9 bg-muted rounded-full animate-pulse" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
                <div className="h-6 w-12 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>No agents connected</p>
            <p className="text-sm">Connect AI agents to see security scores</p>
          </div>
        ) : (
          <div className="space-y-8">
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                  <AvatarFallback>{agent.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">{agent.name}</p>
                  <p className="text-sm text-muted-foreground">Last active: {agent.lastActivity}</p>
                </div>
                <div className="ml-auto font-medium">
                  <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                    {agent.securityScore}% secure
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
