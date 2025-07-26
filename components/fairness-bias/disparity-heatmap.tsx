"use client"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import type { HeatmapData, MetricData } from "@/components/analytics/fairness-bias-tab"

interface DisparityHeatmapProps {
  data: HeatmapData[]
  onCellClick: (group: string, metricName: string, data: MetricData) => void
}

const metricLabels: { [key: string]: string } = {
  disparateImpact: "Disparate Impact Ratio",
  equalOpportunity: "Equal Opportunity Difference",
  demographicParity: "Demographic Parity",
  falsePositiveRate: "False Positive Rate",
}

export function DisparityHeatmap({ data, onCellClick }: DisparityHeatmapProps) {
  const getCellColor = (deviation: number) => {
    // Deviation is 0-100. 0 means no deviation, 100 means max deviation.
    // We want a gradient from green (low deviation) to red (high deviation).
    // Using HSL for a smooth transition: H (hue) from 120 (green) to 0 (red).
    const hue = 120 - (deviation / 100) * 120
    const saturation = 70 // Keep saturation constant for vibrancy
    const lightness = 50 // Keep lightness constant
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 bg-muted/50 px-4 py-2 text-left text-sm font-medium text-muted-foreground">
              Protected Group
            </th>
            {Object.keys(data[0]?.metrics || {}).map((metricKey) => (
              <th key={metricKey} className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">
                {metricLabels[metricKey]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.group} className={cn(rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20")}>
              <td className="sticky left-0 bg-inherit px-4 py-3 text-sm font-medium">{row.group}</td>
              {Object.entries(row.metrics).map(([metricKey, metricData]) => (
                <TooltipProvider key={metricKey}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <td
                        className="cursor-pointer px-4 py-2 text-center"
                        style={{ backgroundColor: getCellColor(metricData.deviation) }}
                        onClick={() => onCellClick(row.group, metricKey, metricData)}
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="font-semibold">{metricData.value.toFixed(2)}</span>
                          <div className="h-8 w-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={metricData.history.map((val) => ({ value: val }))}>
                                <Line
                                  type="monotone"
                                  dataKey="value"
                                  stroke="#fff"
                                  strokeWidth={1}
                                  dot={false}
                                  isAnimationActive={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </td>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{metricLabels[metricKey]}</p>
                      <p>
                        Value: <span className="font-bold">{metricData.value.toFixed(2)}</span>
                      </p>
                      <p>History: {metricData.history.map((val) => val.toFixed(2)).join(", ")} (last 5 days)</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
