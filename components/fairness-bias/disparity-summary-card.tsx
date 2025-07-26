"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { ArrowUpRight, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface DisparitySummaryCardProps {
  maxDisparityRatio: number
}

export function DisparitySummaryCard({ maxDisparityRatio }: DisparitySummaryCardProps) {
  const getStatus = (ratio: number) => {
    if (ratio < 0.8 || ratio > 1.2) {
      return {
        text: "High Disparity",
        color: "text-red-500",
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      }
    } else if (ratio >= 0.8 && ratio <= 1.2 && (ratio < 0.9 || ratio > 1.1)) {
      return {
        text: "Moderate Disparity",
        color: "text-yellow-500",
        icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
      }
    } else {
      return {
        text: "Low Disparity",
        color: "text-green-500",
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      }
    }
  }

  const status = getStatus(maxDisparityRatio)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Max Disparity Ratio</CardTitle>
        <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{maxDisparityRatio.toFixed(2)}</div>
        <p className={cn("text-xs", status.color)}>
          {status.icon} {status.text}
        </p>
      </CardContent>
    </Card>
  )
}
