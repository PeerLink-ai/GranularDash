"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchMetrics()
    }
  }, [user])

  const fetchMetrics = async () => {
    try {
      setError(null)
      const response = await fetch("/api/policies/metrics", { cache: "no-store" })
      if (response.ok) {
        const data = (await response.json()) as PolicyMetrics
        setMetrics(data)
      } else {
        const text = await response.text()
        console.error("Failed to fetch policy metrics:", text)
        setError("Failed to fetch policy metrics")
      }
    } catch (err) {
      console.error("Failed to fetch policy metrics:", err)
      setError("Failed to fetch policy metrics")
    } finally {
      setLoading(false)
    }
  }

  const MetricCard = ({
    title,
    value,
    sub,
    loading,
  }: {
    title: string
    value: string | number
    sub: string
    loading: boolean
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">
          {loading ? <span className="inline-block h-7 w-10 animate-pulse rounded bg-muted" /> : value}
        </div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  )

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Policies & Rules</h2>
        <div className="text-sm text-muted-foreground">
          Manage governance policies and compliance rules{user?.organization ? ` for ${user.organization}` : ""}.
        </div>
      </div>

      {error ? (
        <Alert variant="default">
          <AlertDescription>
            {error}. If this is a new database, run scripts/020-create-governance-policies.sql to seed policy data.
          </AlertDescription>
        </Alert>
      ) : null}

      {/* Policy Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Policies"
          value={metrics.totalPolicies}
          sub="Governance policies defined"
          loading={loading}
        />
        <MetricCard
          title="Active Policies"
          value={metrics.activePolicies}
          sub="Currently enforced policies"
          loading={loading}
        />
        <MetricCard
          title="Open Violations"
          value={metrics.openViolations}
          sub="Violations requiring attention"
          loading={loading}
        />
        <MetricCard
          title="Compliance Rate"
          value={`${metrics.complianceRate}%`}
          sub="Overall compliance score"
          loading={loading}
        />
      </div>

      {/* Policy List */}
      <PolicyList />
    </div>
  )
}
