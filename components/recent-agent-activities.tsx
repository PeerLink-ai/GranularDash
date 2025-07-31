"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

const recentActivities = [
  {
    id: "act001",
    agent: "Agent Alpha",
    activity: "Processed 1,200 transactions",
    timestamp: "2 hours ago",
    status: "Completed",
  },
  {
    id: "act002",
    agent: "Agent Beta",
    activity: "Updated risk assessment model",
    timestamp: "5 hours ago",
    status: "Completed",
  },
  {
    id: "act003",
    agent: "Agent Gamma",
    activity: "Initiated compliance report generation",
    timestamp: "1 day ago",
    status: "In Progress",
  },
]

export function RecentAgentActivities() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Recent Agent Activities</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>All Recent Agent Activities</DialogTitle>
              <DialogDescription>
                A comprehensive list of all recent activities performed by AI agents.
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.agent}</TableCell>
                      <TableCell>{activity.activity}</TableCell>
                      <TableCell>{activity.timestamp}</TableCell>
                      <TableCell>{activity.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{activity.agent}</p>
                <p className="text-xs text-muted-foreground">{activity.activity}</p>
              </div>
              <p className="text-sm text-muted-foreground">{activity.timestamp}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
