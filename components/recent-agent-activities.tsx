"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react"

export function RecentAgentActivities() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentActivities()
    // Set up polling for real-time updates
    const interval = setInterval(loadRecentActivities, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const loadRecentActivities = async () => {
    try {
      // Mock recent activities - in real implementation, fetch from API
      const mockActivities = [
        {
          id: 1,
          agentName: "GPT-4o Enterprise",
          action: "Chat completion",
          status: "success",
          timestamp: "2 minutes ago",
          duration: "1.2s",
        },
        {
          id: 2,
          agentName: "Claude 3 Opus",
          action: "Text analysis",
          status: "success",
          timestamp: "5 minutes ago",
          duration: "0.8s",
        },
        {
          id: 3,
          agentName: "Llama 3 70B",
          action: "Code generation",
          status: "error",
          timestamp: "8 minutes ago",
          duration: "2.1s",
        },
        {
          id: 4,
          agentName: "GPT-4o Enterprise",
          action: "Document summarization",
          status: "success",
          timestamp: "12 minutes ago",
          duration: "1.5s",
        },
        {
          id: 5,
          agentName: "Claude 3 Opus",
          action: "Question answering",
          status: "success",
          timestamp: "15 minutes ago",
          duration: "0.9s",
        },
      ]

      setActivities(mockActivities)
    } catch (error) {
      console.error("Failed to load recent activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-green-500" />
      case "error":
        return <XCircle className="h-3 w-3 text-red-500" />
      default:
        return <Clock className="h-3 w-3 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Agent Activities</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 bg-muted rounded-full"></div>
                  <div className="h-4 bg-muted rounded flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-4">
            <Activity className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No recent activities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="mt-1">{getStatusIcon(activity.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{activity.agentName}</p>
                    <Badge className={getStatusColor(activity.status)} variant="secondary">
                      {activity.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activity.action} • {activity.duration}
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
