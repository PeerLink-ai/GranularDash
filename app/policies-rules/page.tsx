"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PolicyList } from "@/components/policy-list"

interface PolicyMetrics {
  totalPolicies: number
  activePolicies: number
  openViolations: number
  complianceRate: number
}

export default function PoliciesRulesPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<PolicyMetrics>({
    totalPolicies: 0,
    activePolicies: 0,
    openViolations: 0,
    complianceRate: 100,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchMetrics()
    }
  }, [user])

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/policies/metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      } else {
        console.error("Failed to fetch policy metrics:", response.statusText)
      }
    } catch (error) {
      console.error("Failed to fetch policy metrics:", error)
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
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Policies & Rules</h2>
        <div className="flex items-center space-x-2">
          <p className="text-sm text-muted-foreground">
            Manage governance policies and compliance rules for your {user.organization} organization.
          </p>
        </div>
      </div>

      {/* Policy Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-muted h-8 w-8 rounded"></div>
              ) : (
                metrics.totalPolicies
              )}
            </div>
            <p className="text-xs text-muted-foreground">Governance policies defined</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-muted h-8 w-8 rounded"></div>
              ) : (
                metrics.activePolicies
              )}
            </div>
            <p className="text-xs text-muted-foreground">Currently enforced policies</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-muted h-8 w-8 rounded"></div>
              ) : (
                metrics.openViolations
              )}
            </div>
            <p className="text-xs text-muted-foreground">Violations requiring attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? (
                <div className="animate-pulse bg-muted h-8 w-8 rounded"></div>
              ) : (
                `${metrics.complianceRate}%`
              )}
            </div>
            <p className="text-xs text-muted-foreground">Overall compliance score</p>
          </CardContent>
        </Card>
      </div>

      {/* Policy List Component */}
      <PolicyList />
    </div>
  )
}
