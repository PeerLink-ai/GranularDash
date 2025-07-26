"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/analytics/overview-tab"
import { AnalyticsTab } from "@/components/analytics/analytics-tab"
import { NotificationsTab } from "@/components/analytics/notifications-tab"
import { ReportsTab } from "@/components/analytics/reports-tab"
import { DriftDetectionTab } from "@/components/analytics/drift-detection-tab" // Import the new tab
import { FairnessBiasTab } from "@/components/analytics/fairness-bias-tab" // Import the new tab

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("overview")

  return (
    <div className="flex flex-col w-full min-h-screen">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="grid gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              {" "}
              {/* Adjusted grid-cols to accommodate new tabs */}
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="drift-detection">Drift Detection</TabsTrigger> {/* New Tab */}
              <TabsTrigger value="fairness-bias">Fairness & Bias</TabsTrigger> {/* New Tab */}
            </TabsList>
            <TabsContent value="overview">
              <OverviewTab />
            </TabsContent>
            <TabsContent value="analytics">
              <AnalyticsTab />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationsTab />
            </TabsContent>
            <TabsContent value="reports">
              <ReportsTab />
            </TabsContent>
            <TabsContent value="drift-detection">
              <DriftDetectionTab /> {/* Render the new tab component */}
            </TabsContent>
            <TabsContent value="fairness-bias">
              <FairnessBiasTab /> {/* Render the new tab component */}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
