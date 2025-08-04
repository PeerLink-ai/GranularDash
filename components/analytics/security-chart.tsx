"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface SecurityTrendData {
  month: string
  threats: number
  violations: number
}

export function SecurityChart() {
  const [data, setData] = useState<SecurityTrendData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSecurityTrends = async () => {
      try {
        const response = await fetch("/api/analytics/security-trends")
        if (response.ok) {
          const trends = await response.json()
          setData(trends)
        }
      } catch (error) {
        console.error("Failed to fetch security trends:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSecurityTrends()
  }, [])

  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Security Trends</CardTitle>
        <CardDescription>Monthly security threats and policy violations</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        {loading ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-muted-foreground">Loading security trends...</div>
          </div>
        ) : data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p>No security trend data available</p>
              <p className="text-sm">Data will appear as security events are detected</p>
            </div>
          </div>
        ) : (
          <ChartContainer
            config={{
              threats: {
                label: "Threats",
                color: "hsl(var(--chart-1))",
              },
              violations: {
                label: "Violations",
                color: "hsl(var(--chart-2))",
              },
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="threats"
                  stackId="1"
                  stroke="var(--color-threats)"
                  fill="var(--color-threats)"
                />
                <Area
                  type="monotone"
                  dataKey="violations"
                  stackId="1"
                  stroke="var(--color-violations)"
                  fill="var(--color-violations)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
