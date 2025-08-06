"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Shield, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { PolicyList } from "@/components/policy-list"
import { AccessRulesTable } from "@/components/access-rules-table"
import { useToast } from "@/hooks/use-toast"

interface PolicyMetrics {
  totalPolicies: number
  activePolicies: number
  recentViolations: number
  complianceRate: number
}

export default function PoliciesRulesPage() {
  const [metrics, setMetrics] = useState<PolicyMetrics>({
    totalPolicies: 0,
    activePolicies: 0,
    recentViolations: 0,
    complianceRate: 100,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/policies/metrics")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setMetrics(data)
    } catch (error) {
      console.error("Failed to fetch metrics:", error)
      toast({
        title: "Error",
        description: "Failed to load policy metrics",
        variant: "destructive",
      })
      // Set fallback values
      setMetrics({
        totalPolicies: 0,
        activePolicies: 0,
        recentViolations: 0,
        complianceRate: 100,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [])

  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600"
    if (rate >= 85) return "text-yellow-600"
    return "text-red-600"
  }

  const getComplianceIcon = (rate: number) => {
    if (rate >= 95) return <CheckCircle className="h-4 w-4" />
    if (rate >= 85) return <Clock className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Policies & Rules</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Policies & Rules</h2>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">{metrics.activePolicies} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.activePolicies}</div>
            <p className="text-xs text-muted-foreground">Currently enforced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.recentViolations}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <div className={getComplianceColor(metrics.complianceRate)}>
              {getComplianceIcon(metrics.complianceRate)}
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(metrics.complianceRate)}`}>
              {metrics.complianceRate}%
            </div>
            <p className="text-xs text-muted-foreground">Policy adherence</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Policies and Access Rules */}
      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Governance Policies</TabsTrigger>
          <TabsTrigger value="access-rules">Access Rules</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <PolicyList searchQuery={searchQuery} onRefresh={fetchMetrics} />
        </TabsContent>

        <TabsContent value="access-rules" className="space-y-4">
          <AccessRulesTable searchQuery={searchQuery} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
