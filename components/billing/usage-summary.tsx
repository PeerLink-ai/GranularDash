"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface UsageSummaryProps {
  detailed?: boolean
}

export function UsageSummary({ detailed = false }: UsageSummaryProps) {
  const usageData = [
    {
      name: "AI Agents",
      current: 23,
      limit: 50,
      unit: "agents",
      trend: "up",
      change: "+3 this month",
    },
    {
      name: "API Calls",
      current: 847000,
      limit: 1000000,
      unit: "calls",
      trend: "up",
      change: "+12% this month",
    },
    {
      name: "Storage",
      current: 2.4,
      limit: 10,
      unit: "GB",
      trend: "stable",
      change: "No change",
    },
    {
      name: "Compliance Scans",
      current: 156,
      limit: 500,
      unit: "scans",
      trend: "down",
      change: "-8% this month",
    },
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Summary</CardTitle>
        <CardDescription>Current usage across all services in your billing cycle</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 sm:grid-cols-2">
          {usageData.map((item) => {
            const percentage = (item.current / item.limit) * 100
            const isNearLimit = percentage > 80

            return (
              <div key={item.name} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.name}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-bold">{item.current.toLocaleString()}</p>
                      <span className="text-sm text-muted-foreground">
                        / {item.limit.toLocaleString()} {item.unit}
                      </span>
                    </div>
                  </div>
                  {isNearLimit && (
                    <Badge variant="destructive" className="text-xs">
                      Near Limit
                    </Badge>
                  )}
                </div>

                <Progress value={percentage} className="h-2" />

                {detailed && (
                  <div className="flex items-center gap-2 text-sm">
                    {getTrendIcon(item.trend)}
                    <span className={getTrendColor(item.trend)}>{item.change}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {detailed && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">Billing Period</h4>
            <p className="text-sm text-muted-foreground">December 15, 2023 - January 15, 2024</p>
            <p className="text-sm text-muted-foreground">Usage resets on January 15, 2024</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
