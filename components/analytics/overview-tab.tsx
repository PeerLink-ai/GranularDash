"use client"

import { OverviewCards } from "./overview-cards"
import { SecurityChart } from "./security-chart"
import { TopAgents } from "./top-agents"
import { SecurityActivity } from "./security-activity"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

export function OverviewTab() {
  const handleExport = async () => {
    try {
      const response = await fetch("/api/analytics/export")
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `security-analytics-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Analytics data exported successfully")
      } else {
        toast.error("Failed to export analytics data")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast.error("Failed to export analytics data")
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Security Overview</h3>
        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>
      <OverviewCards />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <SecurityChart />
        <TopAgents />
      </div>
      <SecurityActivity />
    </>
  )
}
