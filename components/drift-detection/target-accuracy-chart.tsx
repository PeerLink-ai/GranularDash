"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ReferenceArea,
} from "recharts"
import { DateRangePicker } from "@/components/date-range-picker"
import { useState } from "react"

// Mock data for target accuracy over time
const mockTargetAccuracyData = [
  { date: "2024-01-01", accuracy: 0.92 },
  { date: "2024-01-02", accuracy: 0.91 },
  { date: "2024-01-03", accuracy: 0.9 },
  { date: "2024-01-04", accuracy: 0.88 },
  { date: "2024-01-05", accuracy: 0.85 }, // Below threshold
  { date: "2024-01-06", accuracy: 0.82 },
  { date: "2024-01-07", accuracy: 0.8 },
  { date: "2024-01-08", accuracy: 0.83 },
  { date: "2024-01-09", accuracy: 0.86 }, // Back above threshold
  { date: "2024-01-10", accuracy: 0.89 },
  { date: "2024-01-11", accuracy: 0.9 },
  { date: "2024-01-12", accuracy: 0.92 },
]

export function TargetAccuracyChart() {
  const [dateRange, setDateRange] = useState({ from: new Date("2024-01-01"), to: new Date("2024-01-12") })

  const filteredData = mockTargetAccuracyData.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= dateRange.from && itemDate <= dateRange.to
  })

  const accuracyThreshold = 0.87 // Minimum acceptable accuracy

  const driftAreas = []
  let inDrift = false
  let driftStart = ""

  for (let i = 0; i < filteredData.length; i++) {
    const item = filteredData[i]
    if (item.accuracy < accuracyThreshold && !inDrift) {
      inDrift = true
      driftStart = item.date
    } else if (item.accuracy >= accuracyThreshold && inDrift) {
      inDrift = false
      driftAreas.push({ x1: driftStart, x2: item.date, tooltip: `Accuracy Drop: ${driftStart} to ${item.date}` })
    }
    if (inDrift && i === filteredData.length - 1) {
      driftAreas.push({ x1: driftStart, x2: item.date, tooltip: `Accuracy Drop: ${driftStart} to ${item.date}` })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Target Accuracy Over Time</CardTitle>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            accuracy: {
              label: "Accuracy",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0.7, 1]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="accuracy" stroke="var(--color-accuracy)" dot={false} />
              <ReferenceLine
                y={accuracyThreshold}
                stroke="red"
                strokeDasharray="3 3"
                label={{ value: "Threshold", position: "right", fill: "red", fontSize: 10 }}
              />

              {driftAreas.map((area, index) => (
                <ReferenceArea
                  key={index}
                  x1={area.x1}
                  x2={area.x2}
                  y1={0.7} // Start from the bottom of the chart's domain
                  y2={accuracyThreshold}
                  stroke="red"
                  strokeOpacity={0.3}
                  fill="red"
                  fillOpacity={0.1}
                >
                  <text x="50%" y="50%" fill="red" textAnchor="middle" dominantBaseline="middle" fontSize="10">
                    {area.tooltip}
                  </text>
                </ReferenceArea>
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
