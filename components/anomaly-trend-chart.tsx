"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, XAxis, YAxis } from "recharts"
import { AlertTriangle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface AnomalyDataPoint {
  date: string
  anomalies: number
}

export function AnomalyTrendChart() {
  const { user } = useAuth()
  const [chartData, setChartData] = useState<AnomalyDataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchChartData = async () => {
      if (!user || !user.permissions.includes("view_analytics")) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching anomaly trend data
        // In a real application, this would be an API call to a data analytics service
        const today = new Date()
        const data: AnomalyDataPoint[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          data.push({
            date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            anomalies: Math.floor(Math.random() * 10) + (i < 3 ? 5 : 0), // More anomalies recently
          })
        }
        setChartData(data)
      } catch (err) {
        setError("Failed to load anomaly trend data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchChartData()
    const interval = setInterval(fetchChartData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const chartConfig = {
    anomalies: {
      label: "Anomalies",
      color: "hsl(var(--chart-1))",
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anomaly Trend</CardTitle>
        <CardDescription>Daily count of detected anomalies over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No anomaly data available.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(0, 6)}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Line dataKey="anomalies" type="monotone" stroke="var(--color-anomalies)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
