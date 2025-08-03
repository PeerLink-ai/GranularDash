"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface AuditReadinessData {
  status: "ready" | "needs_attention" | "not_ready"
  score: number
  lastAudit: string
  nextAudit: string
}

export function AuditReadiness() {
  const { user } = useAuth()
  const [readinessData, setReadinessData] = useState<AuditReadinessData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReadiness = async () => {
      if (!user || !user.permissions.includes("view_reports")) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching audit readiness data
        // In a real application, this would be an API call to an audit management service
        const mockReadiness: AuditReadinessData = {
          status: "ready",
          score: 85,
          lastAudit: "2024-06-15",
          nextAudit: "2024-09-15",
        }

        // Adjust based on policy violations (simplified)
        const random = Math.random()
        if (random < 0.1) {
          // 10% chance of not ready
          mockReadiness.status = "not_ready"
          mockReadiness.score = 40 + Math.floor(Math.random() * 10)
        } else if (random < 0.3) {
          // 20% chance of needs attention
          mockReadiness.status = "needs_attention"
          mockReadiness.score = 60 + Math.floor(Math.random() * 10)
        } else {
          mockReadiness.status = "ready"
          mockReadiness.score = 80 + Math.floor(Math.random() * 15)
        }

        setReadinessData(mockReadiness)
      } catch (err) {
        setError("Failed to load audit readiness data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReadiness()
    const interval = setInterval(fetchReadiness, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "needs_attention":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case "not_ready":
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Loader2 className="h-6 w-6 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-green-600 dark:text-green-400"
      case "needs_attention":
        return "text-yellow-600 dark:text-yellow-400"
      case "not_ready":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Readiness</CardTitle>
        <CardDescription>Current status of your organization's audit preparedness.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : readinessData ? (
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-md border p-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(readinessData.status)}
                <div>
                  <p className="font-medium">Overall Readiness</p>
                  <p className="text-sm text-muted-foreground capitalize">{readinessData.status.replace("_", " ")}</p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor(readinessData.status)}`}>{readinessData.score}%</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center rounded-md border p-3">
                <p className="text-sm font-medium">Last Audit</p>
                <p className="text-xs text-muted-foreground">{readinessData.lastAudit}</p>
              </div>
              <div className="flex flex-col items-center rounded-md border p-3">
                <p className="text-sm font-medium">Next Audit</p>
                <p className="text-xs text-muted-foreground">{readinessData.nextAudit}</p>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
