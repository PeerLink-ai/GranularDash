"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const data = [
  { month: "Jan", detectedAnomalies: 15, resolvedAnomalies: 10 },
  { month: "Feb", detectedAnomalies: 18, resolvedAnomalies: 12 },
  { month: "Mar", detectedAnomalies: 22, resolvedAnomalies: 18 },
  { month: "Apr", detectedAnomalies: 20, resolvedAnomalies: 17 },
  { month: "May", detectedAnomalies: 25, resolvedAnomalies: 20 },
  { month: "Jun", detectedAnomalies: 28, resolvedAnomalies: 25 },
]

export function AnomalyTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Detection Trend</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="detectedAnomalies"
                stroke="#ffc658"
                strokeWidth={2}
                name="Detected Anomalies"
              />
              <Line
                type="monotone"
                dataKey="resolvedAnomalies"
                stroke="#82ca9d"
                strokeWidth={2}
                name="Resolved Anomalies"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
