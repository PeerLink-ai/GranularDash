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
import { Badge } from "@/components/ui/badge"

const policyViolations = [
  {
    id: "pv001",
    agent: "Agent Alpha",
    policy: "Data Handling Policy",
    severity: "High",
    date: "2023-10-26",
    description: "Unauthorized access attempt to sensitive customer data.",
  },
  {
    id: "pv002",
    agent: "Agent Beta",
    policy: "Bias Mitigation Policy",
    severity: "Medium",
    date: "2023-10-25",
    description: "Detected potential bias in loan application scoring.",
  },
  {
    id: "pv003",
    agent: "Agent Gamma",
    policy: "Compliance Reporting Policy",
    severity: "Low",
    date: "2023-10-24",
    description: "Delayed submission of daily activity log.",
  },
]

export function PolicyViolations() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "bg-red-500 text-white"
      case "Medium":
        return "bg-yellow-500 text-black"
      case "Low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-200 text-black"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Policy Violations</CardTitle>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[800px]">
            <DialogHeader>
              <DialogTitle>All Policy Violations</DialogTitle>
              <DialogDescription>A comprehensive list of all detected policy violations.</DialogDescription>
            </DialogHeader>
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agent</TableHead>
                    <TableHead>Policy</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {policyViolations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell className="font-medium">{violation.agent}</TableCell>
                      <TableCell>{violation.policy}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                      </TableCell>
                      <TableCell>{violation.date}</TableCell>
                      <TableCell className="text-muted-foreground">{violation.description}</TableCell>
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
          {policyViolations.map((violation) => (
            <div key={violation.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{violation.agent}</p>
                <p className="text-xs text-muted-foreground">{violation.policy}</p>
              </div>
              <Badge className={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
