"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AccessRulesTable } from "@/components/access-rules-table"
import { Shield, Users, Lock, Activity } from "lucide-react"

interface AccessMetrics {
  totalRules: number
  activeRules: number
  recentActivity: number
  complianceScore: number
}

export default function AccessControlPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<AccessMetrics>({
    totalRules: 0,
    activeRules: 0,
    recentActivity: 0,
    complianceScore: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMetrics()
    }
  }, [user])

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/access-control/metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        console.error("Failed to fetch metrics:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Access Control</h1>
        <p className="text-muted-foreground">
          Manage access rules and permissions for your {user.organization} organization.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.totalRules}</div>
            <p className="text-xs text-muted-foreground">Access control rules defined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.activeRules}</div>
            <p className="text-xs text-muted-foreground">Currently enforced rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.recentActivity}</div>
            <p className="text-xs text-muted-foreground">Access events (24h)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `${metrics.complianceScore}%`}</div>
            <p className="text-xs text-muted-foreground">Overall compliance rating</p>
          </CardContent>
        </Card>
      </div>

      {/* Access Rules Table */}
      <AccessRulesTable />
    </div>
  )
}
