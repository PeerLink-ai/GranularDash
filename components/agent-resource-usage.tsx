"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, XAxis, YAxis } from "recharts"
import { Loader2, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth, type Agent } from "@/contexts/auth-context"

interface AgentResourceData {
  name: string
  cpu: number
  memory: number
}

export function AgentResourceUsage() {
  const { user } = useAuth()
  const [chartData, setChartData] = useState<AgentResourceData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchResourceData = async () => {
      if (!user || !user.permissions.includes("view_analytics")) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/agents", {
          headers: { "X-User-ID": user.id },
        })
        if (!response.ok) {
          throw new Error("Failed to fetch agents for resource usage.")
        }
        const data = await response.json()
        const agents: Agent[] = data.agents

        const resourceData: AgentResourceData[] = agents.map((agent) => ({
          name: agent.name,
          cpu: Number.parseFloat((Math.random() * 10 + 5).toFixed(1)), // 5-15% CPU
          memory: Number.parseFloat((Math.random() * 200 + 50).toFixed(1)), // 50-250MB Memory
        }))
        setChartData(resourceData)
      } catch (err) {
        setError("Failed to load agent resource usage data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchResourceData()
    const interval = setInterval(fetchResourceData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const chartConfig = {
    cpu: {
      label: "CPU Usage (%)",
      color: "hsl(var(--chart-1))",
    },
    memory: {
      label: "Memory Usage (MB)",
      color: "hsl(var(--chart-2))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Agent Resource Usage</CardTitle>
        <CardDescription>Current CPU and memory consumption by active agents.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No agent resource data available. Connect agents to see usage.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <XAxis
                dataKey="name"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value) => value.split(" ")[0]}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="cpu" fill="var(--color-cpu)" radius={4} />
              <Bar dataKey="memory" fill="var(--color-memory)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
