"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputFeatureDistributionChart } from "@/components/drift-detection/input-feature-distribution-chart"
import { TargetAccuracyChart } from "@/components/drift-detection/target-accuracy-chart"
import { DriftEventsTable } from "@/components/drift-detection/drift-events-table"

export function DriftDetectionTab() {
  const [timeFrame, setTimeFrame] = useState("last_30_days")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold">Drift Detection & Alerts</h3>
        <Select value={timeFrame} onValueChange={setTimeFrame}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time frame" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
            <SelectItem value="last_90_days">Last 90 Days</SelectItem>
            <SelectItem value="last_12_months">Last 12 Months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputFeatureDistributionChart timeFrame={timeFrame} />
        <TargetAccuracyChart timeFrame={timeFrame} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Drift Events</CardTitle>
        </CardHeader>
        <CardContent>
          <DriftEventsTable />
        </CardContent>
      </Card>
    </div>
  )
}
