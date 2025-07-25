"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { useTheme } from "next-themes"

const data = [
  { month: "Jan", newAgents: 10, totalAgents: 100 },
  { month: "Feb", newAgents: 12, totalAgents: 112 },
  { month: "Mar", newAgents: 15, totalAgents: 127 },
  { month: "Apr", newAgents: 18, totalAgents: 145 },
  { month: "May", newAgents: 20, totalAgents: 165 },
  { month: "Jun", newAgents: 22, totalAgents: 187 },
]

export function AgentDeploymentGrowth() {
  const { theme } = useTheme()

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <Card className="border-none shadow-lg">
          <CardContent className="p-2">
            <p className="text-sm font-semibold">{label}</p>
            <p className="text-sm text-muted-foreground">New Agents: {payload[0].value}</p>
            <p className="text-sm text-muted-foreground">Total Agents: {payload[1].value}</p>
          </CardContent>
        </Card>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="month"
          stroke={theme === "dark" ? "#888888" : "#333333"}
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis stroke={theme === "dark" ? "#888888" : "#333333"} fontSize={12} tickLine={false} axisLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="newAgents" fill={theme === "dark" ? "#adfa1d" : "#0ea5e9"} radius={[4, 4, 0, 0]} />
        <Bar dataKey="totalAgents" fill={theme === "dark" ? "#1e40af" : "#3b82f6"} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
