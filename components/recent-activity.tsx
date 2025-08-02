"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, User, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react"

const getActivityForUser = (user) => {
  const baseActivity = [
    {
      id: "1",
      type: "system",
      title: "System health check completed",
      description: "All systems operational",
      timestamp: "2 minutes ago",
      icon: CheckCircle,
      status: "success",
    },
  ]

  const roleSpecificActivity = {
    admin: [
      {
        id: "2",
        type: "agent",
        title: "GPT-4o agent connected",
        description: "Successfully integrated OpenAI GPT-4o",
        timestamp: "1 hour ago",
        icon: Bot,
        status: "success",
      },
      {
        id: "3",
        type: "user",
        title: "New user added",
        description: "Jordan Kim granted analyst access",
        timestamp: "3 hours ago",
        icon: User,
        status: "info",
      },
      {
        id: "4",
        type: "policy",
        title: "Security policy updated",
        description: "Data retention policy modified",
        timestamp: "1 day ago",
        icon: Shield,
        status: "warning",
      },
    ],
    developer: [
      {
        id: "2",
        type: "agent",
        title: "Agent test completed",
        description: "Replit agent performance test passed",
        timestamp: "30 minutes ago",
        icon: Bot,
        status: "success",
      },
      {
        id: "3",
        type: "agent",
        title: "Claude 3 agent deployed",
        description: "Successfully deployed to production",
        timestamp: "2 hours ago",
        icon: Bot,
        status: "success",
      },
    ],
    analyst: [
      {
        id: "2",
        type: "report",
        title: "Weekly report generated",
        description: "Compliance report for week 47",
        timestamp: "1 hour ago",
        icon: CheckCircle,
        status: "success",
      },
      {
        id: "3",
        type: "alert",
        title: "Anomaly detected",
        description: "Unusual pattern in Claude 3 usage",
        timestamp: "4 hours ago",
        icon: AlertTriangle,
        status: "warning",
      },
    ],
    viewer: [
      {
        id: "2",
        type: "system",
        title: "Dashboard accessed",
        description: "Viewed system metrics",
        timestamp: "5 minutes ago",
        icon: Clock,
        status: "info",
      },
    ],
  }

  return [...baseActivity, ...(roleSpecificActivity[user.role] || [])]
}

export function RecentActivity() {
  const { user } = useAuth()

  if (!user) return null

  const activities = getActivityForUser(user)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "info":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest events and updates in your workspace</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.title}</p>
                    <Badge className={getStatusColor(activity.status)} variant="secondary">
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
