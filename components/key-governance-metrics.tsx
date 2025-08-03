"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Gauge, TrendingUp, ShieldCheck, DollarSign, Loader2, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface GovernanceMetrics {
  complianceScore: number
  riskExposure: number
  policyCoverage: number
  costEfficiency: number
}

export function KeyGovernanceMetrics() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<GovernanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!user || !user.permissions.includes("view_analytics")) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching key governance metrics
        // In a real application, this would be an API call to a metrics service
        const mockMetrics: GovernanceMetrics = {
          complianceScore: 92.5,
          riskExposure: 15.2,
          policyCoverage: 88,
          costEfficiency: 0.85,
        }

        // Adjust based on connected agents (simplified)
        const agentsResponse = await fetch("/api/agents", {
          headers: { "X-User-ID": user.id },
        })
        if (agentsResponse.ok) {
          const agentsData = await agentsResponse.json()
          const totalAgents = agentsData.agents.length
          const activeAgents = agentsData.agents.filter((a: any) => a.status === "active").length
          if (totalAgents > 0) {
            mockMetrics.policyCoverage = Math.min(
              100,
              Math.round((activeAgents / totalAgents) * 100 * (1 + Math.random() * 0.1)),
            )
            mockMetrics.complianceScore = Math.min(100, 85 + Math.round(Math.random() * 10)) // 85-95
            mockMetrics.riskExposure = Math.max(0, 20 - Math.round(Math.random() * 10)) // 10-20
            mockMetrics.costEfficiency = Number.parseFloat((0.7 + Math.random() * 0.2).toFixed(2)) // 0.7-0.9
          } else {
            mockMetrics.policyCoverage = 0
            mockMetrics.complianceScore = 0
            mockMetrics.riskExposure = 0
            mockMetrics.costEfficiency = 0
          }
        }

        setMetrics(mockMetrics)
      } catch (err) {
        setError("Failed to load governance metrics.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 45000) // Refresh every 45 seconds
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Governance Metrics</CardTitle>
        <CardDescription>Overall performance and compliance indicators.</CardDescription>
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
        ) : metrics ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col items-center rounded-lg border p-4">
              <Gauge className="h-8 w-8 text-primary mb-2" />
              <p className="text-lg font-bold">{metrics.complianceScore.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Compliance Score</p>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-4">
              <TrendingUp className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-lg font-bold">{metrics.riskExposure.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Risk Exposure</p>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-4">
              <ShieldCheck className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-lg font-bold">{metrics.policyCoverage.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Policy Coverage</p>
            </div>
            <div className="flex flex-col items-center rounded-lg border p-4">
              <DollarSign className="h-8 w-8 text-blue-500 mb-2" />
              <p className="text-lg font-bold">{metrics.costEfficiency.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">Cost Efficiency Ratio</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
