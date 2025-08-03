"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldAlert, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface PolicyViolation {
  id: string
  agentName: string
  policyName: string
  severity: "high" | "medium" | "low"
  timestamp: string
}

export function PolicyViolations() {
  const { user } = useAuth()
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchViolations = async () => {
      if (!user || !user.permissions.includes("view_reports")) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching policy violations
        // In a real application, this would be an API call to a policy engine/database
        const mockViolations: PolicyViolation[] = [
          {
            id: "pv-001",
            agentName: "GPT-4o Enterprise",
            policyName: "Data Privacy Compliance",
            severity: "high",
            timestamp: "2024-07-30T10:00:00Z",
          },
          {
            id: "pv-002",
            agentName: "Claude 3 Opus",
            policyName: "Content Moderation",
            severity: "medium",
            timestamp: "2024-07-29T14:30:00Z",
          },
          {
            id: "pv-003",
            agentName: "Llama 3 70B",
            policyName: "Usage Cost Threshold",
            severity: "low",
            timestamp: "2024-07-28T09:15:00Z",
          },
        ].filter(
          (violation) =>
            user.permissions.includes("view_audit_logs") || violation.agentName.includes(user.id.split("-")[0]),
        ) // Simplified filtering

        setViolations(mockViolations)
      } catch (err) {
        setError("Failed to load policy violations.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchViolations()
    const interval = setInterval(fetchViolations, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-500"
      case "medium":
        return "text-yellow-500"
      case "low":
        return "text-green-500"
      default:
        return "text-muted-foreground"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <ShieldAlert className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Policy Violations</CardTitle>
        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
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
        ) : violations.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            <p className="text-sm">No policy violations detected.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {violations.map((violation) => (
              <div key={violation.id} className="flex items-start gap-3">
                <div className="pt-1">{getSeverityIcon(violation.severity)}</div>
                <div>
                  <p className="text-sm font-medium">{violation.policyName}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">{violation.agentName}</span> •{" "}
                    <span className={getSeverityColor(violation.severity)}>{violation.severity}</span> •{" "}
                    {new Date(violation.timestamp).toLocaleDateString()}
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
