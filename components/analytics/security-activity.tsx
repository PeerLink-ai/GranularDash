"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Shield, CheckCircle, Info } from "lucide-react"

interface SecurityEvent {
  id: string
  type: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  timestamp: string
  agent?: string
}

export function SecurityActivity() {
  const [events, setEvents] = useState<SecurityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSecurityActivity = async () => {
      try {
        const response = await fetch("/api/analytics/security-activity")
        if (response.ok) {
          const data = await response.json()
          setEvents(data)
        }
      } catch (error) {
        console.error("Failed to fetch security activity:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSecurityActivity()
  }, [])

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "high":
        return <Shield className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Info className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Security Activity</CardTitle>
        <CardDescription>Latest security events and policy violations</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                <div className="space-y-1 flex-1">
                  <div className="h-4 bg-muted rounded animate-pulse" />
                  <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                </div>
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <p>No security events detected</p>
            <p className="text-sm">Your AI agents are operating securely</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="flex items-center space-x-4">
                {getSeverityIcon(event.severity)}
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium leading-none">{event.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.agent && `Agent: ${event.agent} • `}
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
                <Badge variant={getSeverityVariant(event.severity) as any}>{event.severity}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
