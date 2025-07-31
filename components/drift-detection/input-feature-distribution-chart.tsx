"use client"

import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Area, AreaChart } from "recharts"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data for input feature distribution
const inputFeatureData = [
  { name: "Jan", baseline: 50, current: 52, drift: 0 },
  { name: "Feb", baseline: 55, current: 58, drift: 0 },
  { name: "Mar", baseline: 60, current: 65, drift: 0 },
  { name: "Apr", baseline: 62, current: 70, drift: 1 }, // Drift detected
  { name: "May", baseline: 65, current: 68, drift: 0 },
  { name: "Jun", baseline: 70, current: 75, drift: 0 },
  { name: "Jul", baseline: 72, current: 80, drift: 1 }, // Drift detected
  { name: "Aug", baseline: 75, current: 78, drift: 0 },
  { name: "Sep", baseline: 78, current: 85, drift: 1 }, // Drift detected
  { name: "Oct", baseline: 80, current: 82, drift: 0 },
  { name: "Nov", baseline: 82, current: 88, drift: 1 }, // Drift detected
  { name: "Dec", baseline: 85, current: 90, drift: 0 },
]

export function InputFeatureDistributionChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={inputFeatureData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area type="monotone" dataKey="baseline" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Baseline" />
          <Area type="monotone" dataKey="current" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Current" />
          {/* Shaded zones for drift */}
          {inputFeatureData.map((entry, index) =>
            entry.drift === 1 ? (
              <Area
                key={index}
                dataKey="current"
                data={[inputFeatureData[index]]}
                stroke="none"
                fill="#ff0000"
                fillOpacity={0.1}
              />
            ) : null,
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
