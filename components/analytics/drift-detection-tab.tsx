"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InputFeatureDistributionChart } from "@/components/drift-detection/input-feature-distribution-chart"
import { TargetAccuracyChart } from "@/components/drift-detection/target-accuracy-chart"
import { DriftEventsTable } from "@/components/drift-detection/drift-events-table"

export function DriftDetectionTab() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Feature Distribution vs. Baseline</CardTitle>
          </CardHeader>
          <CardContent>
            <InputFeatureDistributionChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Target Accuracy Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetAccuracyChart />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Drift Events</CardTitle>
        </CardHeader>
        <CardContent>
          <DriftEventsTable />
        </CardContent>
      </Card>
    </div>
  )
}
