"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GovernanceOverviewCards } from "@/components/analytics/governance-overview-cards"
import { AnomalyDetectionChart } from "@/components/analytics/anomaly-detection-chart"
import { RecentPolicyViolations } from "@/components/analytics/recent-policy-violations"
import { AgentDeploymentGrowth } from "@/components/analytics/agent-deployment-growth"
import { TopPerformingAgents } from "@/components/analytics/top-performing-agents"
import { AdminActivityLog } from "@/components/analytics/admin-activity-log"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function OverviewTab() {
  const [comparisonPeriod, setComparisonPeriod] = useState("previous_month")

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold">AI Governance Overview</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Compare to:</span>
          <Select value={comparisonPeriod} onValueChange={setComparisonPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous_month">Previous Month</SelectItem>
              <SelectItem value="previous_quarter">Previous Quarter</SelectItem>
              <SelectItem value="previous_year">Previous Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GovernanceOverviewCards comparisonPeriod={comparisonPeriod} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Anomaly Detection Trends</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <AnomalyDetectionChart comparisonPeriod={comparisonPeriod} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Policy Violations</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentPolicyViolations />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Agent Deployment Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <AgentDeploymentGrowth comparisonPeriod={comparisonPeriod} />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Top Performing Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <TopPerformingAgents />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-4">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Admin Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminActivityLog />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
