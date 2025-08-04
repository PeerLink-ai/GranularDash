"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PolicyList } from "@/components/policy-list"
import { FileText, Shield, AlertTriangle, Plus, Activity } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface PolicyMetrics {
  totalPolicies: number
  activePolicies: number
  lastUpdated: string | null
  violations: number
}

export default function PoliciesRulesPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<PolicyMetrics>({
    totalPolicies: 0,
    activePolicies: 0,
    lastUpdated: null,
    violations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization) {
      fetchMetrics()
    }
  }, [user])

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`/api/policies/metrics?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        setMetrics(
          data.metrics || {
            totalPolicies: 0,
            activePolicies: 0,
            lastUpdated: null,
            violations: 0,
          },
        )
      } else {
        console.error("Failed to fetch metrics:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching metrics:", error)
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
        <div className="text-muted-foreground">Please sign in to access this page.</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Policies & Rules</h2>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Policy
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.totalPolicies}</div>
            <p className="text-xs text-muted-foreground">{metrics.activePolicies} active policies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.activePolicies}</div>
            <p className="text-xs text-muted-foreground">Currently enforced</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : metrics.lastUpdated ? new Date(metrics.lastUpdated).toLocaleDateString() : "Never"}
            </div>
            <p className="text-xs text-muted-foreground">Most recent update</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "..." : metrics.violations}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="policies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="violations">Violations</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Management</CardTitle>
              <CardDescription>Create and manage AI governance policies for your organization</CardDescription>
            </CardHeader>
            <CardContent>
              <PolicyList />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Policy Violations</CardTitle>
              <CardDescription>Track and manage policy violations across your AI agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">No policy violations detected</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
              <CardDescription>Monitor compliance with regulatory requirements and internal policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">Compliance monitoring coming soon...</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
