"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ConnectedAgentsOverview } from "@/components/connected-agents-overview"
import { QuickActions } from "@/components/quick-actions"
import { RecentActivity } from "@/components/recent-activity"
import { SystemHealth } from "@/components/system-health"
import { Bot, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"

export function DashboardOverview() {
  const { user } = useAuth()
  const [connectedAgentsCount, setConnectedAgentsCount] = useState(0)

  useEffect(() => {
    const fetchAgents = async () => {
      if (user) {
        try {
          const response = await fetch("/api/agents", {
            headers: {
              "X-User-ID": user.id,
            },
          })
          if (response.ok) {
            const data = await response.json()
            setConnectedAgentsCount(data.agents.length)
          } else {
            console.error("Failed to fetch agents:", response.statusText)
            setConnectedAgentsCount(0)
          }
        } catch (error) {
          console.error("Error fetching agents:", error)
          setConnectedAgentsCount(0)
        }
      }
    }
    fetchAgents()
  }, [user])

  if (!user) return null

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "developer":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "analyst":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "viewer":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  const getWelcomeMessage = () => {
    switch (user.role) {
      case "admin":
        return "You have full administrative access to all AI governance features."
      case "developer":
        return "Manage and test your connected AI agents with development tools."
      case "analyst":
        return "Access analytics and reporting features for AI governance insights."
      case "viewer":
        return "View dashboard metrics and system status information."
      default:
        return "Welcome to your AI governance dashboard."
    }
  }

  const hasConnectedAgents = connectedAgentsCount > 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-muted-foreground mt-1">{getWelcomeMessage()}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getRoleColor(user.role)}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>
          <Badge variant="outline">{user.organization}</Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedAgentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {hasConnectedAgents ? "Active and monitored" : "No agents connected"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user.permissions.length}</div>
            <p className="text-xs text-muted-foreground">Access levels granted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No active alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Connected Agents Overview */}
        <ConnectedAgentsOverview />

        {/* Quick Actions */}
        <QuickActions />
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <RecentActivity />

        {/* System Health */}
        <SystemHealth />
      </div>
    </div>
  )
}
