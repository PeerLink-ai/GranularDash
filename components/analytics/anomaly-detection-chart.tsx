"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"

const data = [
  { month: "Jan", anomalies: 15 },
  { month: "Feb", anomalies: 18 },
  { month: "Mar", anomalies: 22 },
  { month: "Apr", anomalies: 20 },
  { month: "May", anomalies: 25 },
  { month: "Jun", anomalies: 28 },
  { month: "Jul", anomalies: 26 },
  { month: "Aug", anomalies: 30 },
  { month: "Sep", anomalies: 33 },
  { month: "Oct", anomalies: 31 },
  { month: "Nov", anomalies: 35 },
  { month: "Dec", anomalies: 40 },
]

export function AnomalyDetectionChart() {
  const { theme } = useTheme()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="border-none shadow-lg">
          <CardContent className="p-2">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground">Anomalies Detected: {payload[0].value.toLocaleString()}</p>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey="month"
          stroke={theme === "dark" ? "#888888" : "#333333"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke={theme === "dark" ? "#888888" : "#333333"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="anomalies"
          stroke={theme === "dark" ? "#adfa1d" : "#0ea5e9"}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
