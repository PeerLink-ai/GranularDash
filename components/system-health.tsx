"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertTriangle, Server, Database, Wifi } from "lucide-react"

const systemMetrics = [
  {
    name: "API Gateway",
    status: "healthy",
    uptime: 99.9,
    icon: Server,
    description: "All endpoints responding normally",
  },
  {
    name: "Database",
    status: "healthy",
    uptime: 99.8,
    icon: Database,
    description: "Query performance optimal",
  },
  {
    name: "Agent Connections",
    status: "healthy",
    uptime: 99.7,
    icon: Wifi,
    description: "All agents connected and responsive",
  },
]

export function SystemHealth() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return CheckCircle
      case "warning":
      case "error":
        return AlertTriangle
      default:
        return CheckCircle
    }
  }

  const overallHealth = systemMetrics.every((metric) => metric.status === "healthy") ? "healthy" : "warning"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <span>System Health</span>
          <Badge className={getStatusColor(overallHealth)}>
            {overallHealth === "healthy" ? "All Systems Operational" : "Some Issues Detected"}
          </Badge>
        </CardTitle>
        <CardDescription>Real-time monitoring of system components</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systemMetrics.map((metric) => {
            const Icon = metric.icon
            const StatusIcon = getStatusIcon(metric.status)

            return (
              <div key={metric.name} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{metric.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <StatusIcon
                      className={`h-4 w-4 ${metric.status === "healthy" ? "text-green-500" : "text-yellow-500"}`}
                    />
                    <span className="text-sm font-medium">{metric.uptime}%</span>
                  </div>
                </div>
                <Progress value={metric.uptime} className="h-2" />
                <p className="text-xs text-muted-foreground">{metric.description}</p>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
