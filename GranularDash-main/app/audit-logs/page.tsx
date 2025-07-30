"use client"

import { useState, useEffect } from "react"
import { AuditLogTable } from "@/components/audit-log-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuditLogsPage() {
  const [stats, setStats] = useState({
    totalLogs: 0,
    failedActions: 0,
    topAgent: 'None'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [logsResponse, agentsResponse] = await Promise.all([
        fetch('/api/agents/actions'),
        fetch('/api/agents/list')
      ])
      
      const logsData = await logsResponse.json()
      const agentsData = await agentsResponse.json()
      
      const logs = logsData.logs || []
      const agents = agentsData.agents || []
      
      // Calculate statistics
      const failedActions = logs.filter(log => log.status === 'Failed').length
      const agentActivity = {}
      
      logs.forEach(log => {
        if (log.agentId) {
          agentActivity[log.agentId] = (agentActivity[log.agentId] || 0) + 1
        }
      })
      
      const topAgent = Object.keys(agentActivity).length > 0 
        ? Object.entries(agentActivity).sort(([,a], [,b]) => b - a)[0][0]
        : 'None'

      setStats({
        totalLogs: logs.length,
        failedActions,
        topAgent
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Agent Action Logs</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {loading ? '...' : stats.totalLogs}
            </div>
            <p className="text-sm text-muted-foreground">All agent actions recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Failed Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-500">
              {loading ? '...' : stats.failedActions}
            </div>
            <p className="text-sm text-muted-foreground">Actions that failed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most Active Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats.topAgent}
            </div>
            <p className="text-sm text-muted-foreground">Agent with most actions</p>
          </CardContent>
        </Card>
      </div>

      <AuditLogTable />
    </div>
  )
}
