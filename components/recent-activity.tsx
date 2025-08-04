"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, User, Bot, Shield, FileText, AlertTriangle, CheckCircle, Clock } from "lucide-react"

interface ActivityItem {
  id: string
  user_id: string
  user_name: string
  organization: string
  action: string
  resource_type: string
  resource_id?: string
  description: string
  status: "success" | "warning" | "error" | "info"
  timestamp: string
  ip_address?: string
}

export function RecentActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization) {
      fetchActivities()
    }
  }, [user])

  const fetchActivities = async () => {
    try {
      const response = await fetch(`/api/activity?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (resourceType: string, status: string) => {
    switch (resourceType) {
      case "user":
        return User
      case "agent":
        return Bot
      case "policy":
        return Shield
      case "report":
        return FileText
      default:
        return status === "error" ? AlertTriangle : status === "success" ? CheckCircle : Activity
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "warning":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "info":
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return "Just now"
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading activities...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchActivities}>
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
            <p className="text-muted-foreground mb-4">
              Activity from your organization will appear here as team members interact with the system.
            </p>
            <p className="text-sm text-muted-foreground">
              Try connecting an agent or updating your settings to see activity logs.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 10).map((activity) => {
              const IconComponent = getActivityIcon(activity.resource_type, activity.status)
              return (
                <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <div className="p-2 rounded-full bg-muted">
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(activity.status)}>{activity.status}</Badge>
                        <span className="text-xs text-muted-foreground">{formatTimestamp(activity.timestamp)}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">by {activity.user_name}</p>
                  </div>
                </div>
              )
            })}
            {activities.length > 10 && (
              <div className="text-center pt-4">
                <Button variant="outline" size="sm">
                  View All Activity
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
