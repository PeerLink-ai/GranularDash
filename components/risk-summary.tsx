"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, LineChart } from "lucide-react" // Assuming these are used for icons or placeholders

export function RiskSummary() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Summary</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Total Open Risks</p>
            <p className="text-2xl font-bold text-red-500">12</p>
          </div>
          <BarChart className="h-8 w-8 text-red-500" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Mitigated Risks (Last 30 Days)</p>
            <p className="text-2xl font-bold text-green-500">8</p>
          </div>
          <LineChart className="h-8 w-8 text-green-500" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Average Risk Score</p>
            <p className="text-2xl font-bold text-yellow-500">7.2</p>
          </div>
          <span className="text-xl">📊</span> {/* Placeholder for a more complex chart */}
        </div>
      </CardContent>
    </Card>
  )
}
