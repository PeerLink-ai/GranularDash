"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ReferenceArea } from "recharts"
import { DateRangePicker } from "@/components/date-range-picker"
import { useState } from "react"

// Mock data for input feature distribution
const mockInputFeatureData = [
  { date: "2024-01-01", current: 0.5, baseline: 0.52 },
  { date: "2024-01-02", current: 0.51, baseline: 0.52 },
  { date: "2024-01-03", current: 0.53, baseline: 0.52 },
  { date: "2024-01-04", current: 0.55, baseline: 0.52 },
  { date: "2024-01-05", current: 0.58, baseline: 0.52 }, // Drift starts
  { date: "2024-01-06", current: 0.62, baseline: 0.52 },
  { date: "2024-01-07", current: 0.65, baseline: 0.52 },
  { date: "2024-01-08", current: 0.63, baseline: 0.52 },
  { date: "2024-01-09", current: 0.6, baseline: 0.52 },
  { date: "2024-01-10", current: 0.57, baseline: 0.52 }, // Drift ends
  { date: "2024-01-11", current: 0.53, baseline: 0.52 },
  { date: "2024-01-12", current: 0.51, baseline: 0.52 },
]

export function InputFeatureDistributionChart() {
  const [dateRange, setDateRange] = useState({ from: new Date("2024-01-01"), to: new Date("2024-01-12") })

  const filteredData = mockInputFeatureData.filter((item) => {
    const itemDate = new Date(item.date)
    return itemDate >= dateRange.from && itemDate <= dateRange.to
  })

  // Define drift thresholds and areas
  const driftThresholdUpper = 0.55
  const driftThresholdLower = 0.45

  const driftAreas = []
  let inDrift = false
  let driftStart = ""

  for (let i = 0; i < filteredData.length; i++) {
    const item = filteredData[i]
    if ((item.current > driftThresholdUpper || item.current < driftThresholdLower) && !inDrift) {
      inDrift = true
      driftStart = item.date
    } else if (!(item.current > driftThresholdUpper || item.current < driftThresholdLower) && inDrift) {
      inDrift = false
      driftAreas.push({ x1: driftStart, x2: item.date, tooltip: `Drift: ${driftStart} to ${item.date}` })
    }
    if (inDrift && i === filteredData.length - 1) {
      driftAreas.push({ x1: driftStart, x2: item.date, tooltip: `Drift: ${driftStart} to ${item.date}` })
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Input Feature Distribution vs. Baseline</CardTitle>
        <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            current: {
              label: "Current Distribution",
              color: "hsl(var(--chart-1))",
            },
            baseline: {
              label: "Baseline Distribution",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="current" stroke="var(--color-current)" dot={false} />
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="var(--color-baseline)"
                strokeDasharray="5 5"
                dot={false}
              />

              {driftAreas.map((area, index) => (
                <ReferenceArea
                  key={index}
                  x1={area.x1}
                  x2={area.x2}
                  y1={0}
                  y2={1} // Assuming y-axis goes from 0 to 1 for distribution
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
