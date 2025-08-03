"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, CheckCircle, AlertTriangle, XCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

interface SystemHealthData {
  status: "healthy" | "degraded" | "critical"
  message: string
  lastChecked: string
}

export function SystemHealthOverview() {
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHealth = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching real-time system health data
        // In a real application, this would be an API call to a monitoring service
        const mockHealth: SystemHealthData = {
          status: "healthy",
          message: "All core services are operational.",
          lastChecked: new Date().toLocaleTimeString(),
        }

        // Simulate occasional degraded or critical status
        const random = Math.random()
        if (random < 0.05) {
          // 5% chance of critical
          mockHealth.status = "critical"
          mockHealth.message = "Critical service outage detected. Immediate attention required."
        } else if (random < 0.15) {
          // 10% chance of degraded
          mockHealth.status = "degraded"
          mockHealth.message = "Some services are experiencing minor issues."
        }

        setHealthData(mockHealth)
      } catch (err) {
        setError("Failed to fetch system health data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 15000) // Refresh every 15 seconds
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />
      case "critical":
        return <XCircle className="h-6 w-6 text-red-500" />
      default:
        return <Activity className="h-6 w-6 text-muted-foreground" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 dark:text-green-400"
      case "degraded":
        return "text-yellow-600 dark:text-yellow-400"
      case "critical":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health Overview</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
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
        ) : healthData ? (
          <>
            <div className={`text-2xl font-bold ${getStatusColor(healthData.status)} flex items-center gap-2`}>
              {getStatusIcon(healthData.status)}
              {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{healthData.message}</p>
            <p className="text-xs text-muted-foreground mt-2">Last checked: {healthData.lastChecked}</p>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
