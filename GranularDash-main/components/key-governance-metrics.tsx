"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function KeyGovernanceMetrics() {
  const [metrics, setMetrics] = useState({
    totalAgents: 0,
    activeAgents: 0,
    successRate: 0,
    totalActions: 0,
    failedActions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const [agentsResponse, logsResponse] = await Promise.all([
        fetch('/api/agents/list'),
        fetch('/api/agents/actions')
      ])
      
      const agentsData = await agentsResponse.json()
      const logsData = await logsResponse.json()
      
      const agents = agentsData.agents || []
      const logs = logsData.logs || []
      
      const totalAgents = agents.length
      const activeAgents = agents.filter(agent => agent.status === 'active').length
      const totalActions = logs.length
      const failedActions = logs.filter(log => log.status === 'Failed').length
      const successRate = totalActions > 0 ? ((totalActions - failedActions) / totalActions * 100).toFixed(1) : 0
      
      setMetrics({
        totalAgents,
        activeAgents,
        successRate: parseFloat(successRate),
        totalActions,
        failedActions
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Key Governance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading metrics...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Governance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Agents</p>
            <p className="text-2xl font-bold">{metrics.totalAgents}</p>
            <p className="text-xs text-muted-foreground">
              {metrics.activeAgents} active
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
            <p className="text-2xl font-bold">{metrics.successRate}%</p>
            <p className="text-xs text-muted-foreground">
              {metrics.totalActions - metrics.failedActions} of {metrics.totalActions} actions
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Total Actions</p>
            <p className="text-2xl font-bold">{metrics.totalActions}</p>
            <p className="text-xs text-muted-foreground">
              All time actions recorded
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Failed Actions</p>
            <p className="text-2xl font-bold text-red-600">{metrics.failedActions}</p>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </div>
        </div>
        
        {metrics.totalAgents === 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              No agents connected yet. Add your first agent to start monitoring.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
