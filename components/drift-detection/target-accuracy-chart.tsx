"use client"

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, ReferenceLine, Area } from "recharts"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// Mock data for target accuracy over time
const targetAccuracyData = [
  { name: "Jan", accuracy: 0.92 },
  { name: "Feb", accuracy: 0.91 },
  { name: "Mar", accuracy: 0.93 },
  { name: "Apr", accuracy: 0.88 }, // Below threshold
  { name: "May", accuracy: 0.9 },
  { name: "Jun", accuracy: 0.87 }, // Below threshold
  { name: "Jul", accuracy: 0.91 },
  { name: "Aug", accuracy: 0.85 }, // Below threshold
  { name: "Sep", accuracy: 0.89 },
  { name: "Oct", accuracy: 0.92 },
  { name: "Nov", accuracy: 0.86 }, // Below threshold
  { name: "Dec", accuracy: 0.9 },
]

const accuracyThreshold = 0.88 // Example threshold

export function TargetAccuracyChart() {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={targetAccuracyData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0.8, 1]} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ReferenceLine y={accuracyThreshold} stroke="red" strokeDasharray="3 3" label="Threshold" />
          <Line type="monotone" dataKey="accuracy" stroke="#8884d8" activeDot={{ r: 8 }} name="Accuracy" />
          {/* Shaded zones for values below threshold */}
          {targetAccuracyData.map((entry, index) =>
            entry.accuracy < accuracyThreshold ? (
              <Area
                key={index}
                dataKey="accuracy"
                data={[targetAccuracyData[index]]}
                stroke="none"
                fill="#ff0000"
                fillOpacity={0.1}
              />
            ) : null,
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
