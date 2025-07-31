"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Line, LineChart, ResponsiveContainer } from "recharts"
import type { HeatmapData, MetricData } from "@/components/analytics/fairness-bias-tab"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface DisparityHeatmapProps {
  data: HeatmapData[]
  onCellClick: (group: string, metricName: string, data: MetricData) => void
}

const getDeviationColor = (deviation: number) => {
  if (deviation > 70) return "bg-red-100 dark:bg-red-900/20"
  if (deviation > 40) return "bg-yellow-100 dark:bg-yellow-900/20"
  return "bg-green-100 dark:bg-green-900/20"
}

const getTextColor = (deviation: number) => {
  if (deviation > 70) return "text-red-700 dark:text-red-300"
  if (deviation > 40) return "text-yellow-700 dark:text-yellow-300"
  return "text-green-700 dark:text-green-300"
}

export function DisparityHeatmap({ data, onCellClick }: DisparityHeatmapProps) {
  const metrics = ["disparateImpact", "equalOpportunity", "demographicParity", "falsePositiveRate"]
  const metricLabels: { [key: string]: string } = {
    disparateImpact: "Disparate Impact",
    equalOpportunity: "Equal Opportunity",
    demographicParity: "Demographic Parity",
    falsePositiveRate: "False Positive Rate",
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Protected Group</TableHead>
            {metrics.map((metric) => (
              <TableHead key={metric} className="text-center">
                {metricLabels[metric]}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.group}>
              <TableCell className="font-medium">{row.group}</TableCell>
              {metrics.map((metricKey) => {
                const metricData = row.metrics[metricKey as keyof typeof row.metrics]
                return (
                  <TableCell
                    key={`${row.group}-${metricKey}`}
                    className={cn(
                      "relative p-2 text-center cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
                      getDeviationColor(metricData.deviation),
                    )}
                    onClick={() => onCellClick(row.group, metricKey, metricData)}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center">
                            <span className={cn("font-semibold", getTextColor(metricData.deviation))}>
                              {metricData.value.toFixed(2)}
                            </span>
                            <div className="h-8 w-full max-w-[80px] opacity-70">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={metricData.history.map((val) => ({ value: val }))}>
                                  <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke={getTextColor(metricData.deviation)
                                      .replace("text-", "#")
                                      .replace("dark:", "")}
                                    strokeWidth={2}
                                    dot={false}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            Value: {metricData.value.toFixed(2)}
                            <br />
                            History: {metricData.history.map((v) => v.toFixed(2)).join(", ")}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
