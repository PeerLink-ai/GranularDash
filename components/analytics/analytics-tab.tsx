"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const agentBehaviorCategories = [
  { segment: "Compliant", count: 8500 },
  { segment: "Minor Deviations", count: 1200 },
  { segment: "Policy Violations", count: 150 },
  { segment: "Anomalous Behavior", count: 75 },
  { segment: "Collusion Detected", count: 5 },
]

const policyAdherenceRateData = [
  { month: "Jan", rate: 92 },
  { month: "Feb", rate: 93 },
  { month: "Mar", rate: 91 },
  { month: "Apr", rate: 94 },
  { month: "May", rate: 96 },
  { month: "Jun", rate: 95 },
]

const governanceEnginePerformanceData = [
  { metric: "Detection Accuracy", value: 98.5, unit: "%" },
  { metric: "False Positives", value: 1.2, unit: "%" },
  { metric: "Response Time", value: 250, unit: "ms" },
  { metric: "Audit Log Integrity", value: 100, unit: "%" },
]

export function AnalyticsTab() {
  const { theme } = useTheme()
  const [timeFrame, setTimeFrame] = useState("last_30_days")

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-semibold">Detailed Behavioral Analytics</h3>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
            <SelectItem value="last_90_days">Last 90 Days</SelectItem>
            <SelectItem value="last_12_months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Agent Behavior Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentBehaviorCategories}>
                <XAxis dataKey="segment" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill={theme === "dark" ? "#adfa1d" : "#0ea5e9"} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Policy Adherence Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={policyAdherenceRateData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value}%`} />
                <Tooltip />
                <Line type="monotone" dataKey="rate" stroke={theme === "dark" ? "#adfa1d" : "#0ea5e9"} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Governance Engine Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {governanceEnginePerformanceData.map((item) => (
                <div key={item.metric} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{item.metric}</p>
                  <p className="text-2xl font-bold">
                    {item.value}
                    {item.unit}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Key Behavioral Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Goal Drift Incidents</p>
              <p className="text-2xl font-bold">7</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Collusion Attempts Detected</p>
              <p className="text-2xl font-bold">2</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Average Anomaly Resolution Time</p>
              <p className="text-2xl font-bold">4.5 hrs</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Policy Update Frequency</p>
              <p className="text-2xl font-bold">Monthly</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
