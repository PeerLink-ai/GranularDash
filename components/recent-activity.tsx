"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"

interface ActivityLog {
  agentId: string
  agentName: string
  type: "test" | "deployment" | "status_change" | "policy_violation"
  status: "success" | "error" | "warning"
  message: string
  timestamp: string
}

export function RecentActivity() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching recent activities from a user-specific log
        // In a real app, this would be an API call to a backend service
        const mockActivities: ActivityLog[] = [
          {
            agentId: "openai-gpt4o-001",
            agentName: "GPT-4o Enterprise",
            type: "test",
            status: "success",
            message: "Agent test completed successfully.",
            timestamp: "5 minutes ago",
          },
          {
            agentId: "anthropic-claude3-001",
            agentName: "Claude 3 Opus",
            type: "status_change",
            status: "warning",
            message: "Agent status changed to 'paused' due to high usage.",
            timestamp: "30 minutes ago",
          },
          {
            agentId: "groq-llama3-001",
            agentName: "Llama 3 70B",
            type: "deployment",
            status: "success",
            message: "New agent deployed successfully.",
            timestamp: "1 hour ago",
          },
          {
            agentId: "openai-gpt4o-001",
            agentName: "GPT-4o Enterprise",
            type: "policy_violation",
            status: "error",
            message: "Policy violation detected: Sensitive data exposure.",
            timestamp: "2 hours ago",
          },
        ].filter((activity) => user.permissions.includes("view_audit_logs") || activity.agentId === user.id) // Simplified filtering

        setActivities(mockActivities)
      } catch (err) {
        setError("Failed to load recent activities.")
        setActivities([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivities()
  }, [user])

  if (!user) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest actions and events across your AI agents.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading activities...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">
            <AlertTriangle className="mx-auto h-12 w-12 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error loading activities</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recent activity</h3>
            <p className="text-muted-foreground mb-4">There are no recent activities to display for your account.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className="pt-1">{getStatusIcon(activity.status)}</div>
                <div>
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">{activity.agentName}</span> • {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
