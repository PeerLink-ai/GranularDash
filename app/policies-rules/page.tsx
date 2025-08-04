"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PolicyList } from "@/components/policy-list"
import { FileText, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

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
        console.error("Failed to fetch metrics:", response.statusText)
        toast({
          title: "Error",
          description: "Failed to load policy metrics",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      toast({
        title: "Error",
        description: "Failed to load policy metrics",
        variant: "destructive",
      })
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
        <h1 className="text-3xl font-bold tracking-tight">Policies & Rules</h1>
        <p className="text-muted-foreground">
          Manage governance policies and compliance rules for your {user.organization} organization.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">Governance policies defined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.activePolicies}</div>
            <p className="text-xs text-muted-foreground">Currently enforced policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.openViolations}</div>
            <p className="text-xs text-muted-foreground">Violations requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : `${metrics.complianceRate}%`}</div>
            <p className="text-xs text-muted-foreground">Overall compliance score</p>
          </CardContent>
        </Card>
      </div>

      {/* Policy List */}
      <PolicyList />
    </div>
  )
}
