"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Bot, CheckCircle, XCircle, AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface AgentActivity {
  agentId: string
  agentName: string
  type: string // e.g., "test", "deployment", "status_change"
  status: "success" | "error" | "warning"
  message: string
  timestamp: string
}

export function RecentAgentActivities() {
  const { user } = useAuth()
  const [activities, setActivities] = useState<AgentActivity[]>([])
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
        const mockActivities: AgentActivity[] = [
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
          {
            agentId: "replit-agent-001",
            agentName: "Replit Agent",
            type: "test",
            status: "success",
            message: "Code generation test passed.",
            timestamp: "3 hours ago",
          },
        ].filter(
          (activity) =>
            user.permissions.includes("view_audit_logs") || activity.agentId.startsWith(user.id.split("-")[0]),
        ) // Simplified filtering based on user role/id prefix

        setActivities(mockActivities)
      } catch (err) {
        setError("Failed to load recent agent activities.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivities()
    const interval = setInterval(fetchActivities, 20000) // Refresh every 20 seconds
    return () => clearInterval(interval)
  }, [user])

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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Recent Agent Activities</CardTitle>
        <Bot className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-4">
            <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p className="text-sm">No recent activities to display.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="pt-1">{getStatusIcon(activity.status)}</div>
                <div>
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
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
