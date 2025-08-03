"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain, Bot, Code, Zap, Activity, Server } from "lucide-react"

export function AgentDetailsModal({ isOpen, onOpenChange, agent }) {
  if (!agent) return null

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return Brain
      case "anthropic":
        return Bot
      case "replit":
        return Code
      case "groq":
        return Zap
      default:
        return Bot
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "testing":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const Icon = getProviderIcon(agent.provider)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <span>{agent.name}</span>
          </DialogTitle>
          <DialogDescription>Detailed information and metrics for this AI agent</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provider</p>
                  <p className="text-lg">{agent.provider}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Model</p>
                  <p className="text-lg">{agent.model}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge className={getStatusColor(agent.status)}>{agent.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Connected</p>
                  <p className="text-lg">{new Date(agent.connectedAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Endpoint</p>
                <p className="text-sm font-mono bg-muted p-2 rounded">{agent.endpoint}</p>
              </div>
            </CardContent>
          </Card>

          {/* Usage Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Usage Metrics</span>
              </CardTitle>
              <CardDescription>Performance and usage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">{agent.usage.requests.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{agent.usage.tokensUsed.toLocaleString()}</div>
                  <p className="text-sm text-muted-foreground">Tokens Used</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">${agent.usage.estimatedCost}</div>
                  <p className="text-sm text-muted-foreground">Estimated Cost</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Request Volume</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Time</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Success Rate</span>
                    <span>98%</span>
                  </div>
                  <Progress value={98} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Health Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Server className="h-4 w-4" />
                <span>Health Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Connection Status</span>
                  <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Health Check</span>
                  <span className="text-sm text-muted-foreground">2 minutes ago</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Uptime</span>
                  <span className="text-sm text-muted-foreground">99.9%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Last Active</span>
                  <span className="text-sm text-muted-foreground">{agent.lastActive}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
