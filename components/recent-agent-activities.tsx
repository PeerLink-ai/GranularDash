"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation" // Import useRouter

const agentActivities = [
  {
    id: 1,
    agentId: "AI-Finance-001",
    action: "Executed Trade",
    status: "Success",
    date: "2023-07-25 10:30 AM",
    type: "success",
  },
  {
    id: 2,
    agentId: "AI-SupplyChain-005",
    action: "Flagged Inventory Anomaly",
    status: "Alert",
    date: "2023-07-25 09:45 AM",
    type: "alert",
  },
  {
    id: 3,
    agentId: "AI-HR-002",
    action: "Processed Onboarding",
    status: "Success",
    date: "2023-07-24 04:00 PM",
    type: "success",
  },
  {
    id: 4,
    agentId: "AI-Legal-003",
    action: "Policy Violation Detected",
    status: "Critical",
    date: "2023-07-24 02:15 PM",
    type: "critical",
  },
  {
    id: 5,
    agentId: "AI-Energy-007",
    action: "Optimized Grid Load",
    status: "Success",
    date: "2023-07-23 11:00 AM",
    type: "success",
  },
]

export function RecentAgentActivities() {
  const router = useRouter() // Initialize useRouter

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Recent Agent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agentActivities.slice(0, 3).map((activity) => (
            <div key={activity.id} className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium">{activity.agentId}</p>
                <p className="text-xs text-muted-foreground">{activity.action}</p>
              </div>
              <div className="flex items-center">
                <span
                  className={`text-sm font-medium ${
                    activity.type === "success"
                      ? "text-green-600 dark:text-green-400"
                      : activity.type === "alert"
                        ? "text-yellow-600 dark:text-yellow-400"
                        : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {activity.status}
                </span>
                {activity.type === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 ml-1" />
                ) : activity.type === "alert" ? (
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 ml-1" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 ml-1" />
                )}
              </div>
            </div>
          ))}
        </div>
        <Button className="w-full mt-4 bg-transparent" variant="outline" onClick={() => router.push("/audit-logs")}>
          View All Activities
        </Button>
      </CardContent>
    </Card>
  )
}
