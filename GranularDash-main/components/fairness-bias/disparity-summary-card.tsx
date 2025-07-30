"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Dot } from "lucide-react"

interface DisparitySummaryCardProps {
  maxDisparityRatio: number
}

export function DisparitySummaryCard({ maxDisparityRatio }: DisparitySummaryCardProps) {
  let statusColor = "text-green-500"
  let statusText = "Good"

  if (maxDisparityRatio > 0.6 && maxDisparityRatio <= 0.8) {
    statusColor = "text-yellow-500"
    statusText = "Needs Improvement"
  } else if (maxDisparityRatio > 0.8) {
    statusColor = "text-red-500"
    statusText = "Poor"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Max Disparity Ratio</CardTitle>
        <Dot className={cn("h-6 w-6", statusColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{maxDisparityRatio.toFixed(2)}</div>
        <p className={cn("text-xs text-muted-foreground", statusColor)}>{statusText}</p>
      </CardContent>
    </Card>
  )
}
