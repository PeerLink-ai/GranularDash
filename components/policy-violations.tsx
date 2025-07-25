"use client"

import { useState } from "react"
import { AlertTriangle, Info, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ViolationDetailsModal } from "@/components/violation-details-modal"

type Violation = {
  id: string
  policyName: string
  agentId: string
  severity: "High" | "Medium" | "Low"
  status: "Open" | "Resolved" | "Acknowledged"
  timestamp: string
  description: string
  actionTaken?: string
}

const initialViolations: Violation[] = [
  {
    id: "PV001",
    policyName: "Data Exfiltration Prevention",
    agentId: "Agent-001",
    severity: "High",
    status: "Open",
    timestamp: "2024-07-24 10:30 AM",
    description: "Attempted unauthorized data transfer to external server.",
    actionTaken: "Blocked transfer, alerted security team.",
  },
  {
    id: "PV002",
    policyName: "Sensitive Data Access Control",
    agentId: "Agent-005",
    severity: "Medium",
    status: "Acknowledged",
    timestamp: "2024-07-23 03:15 PM",
    description: "User accessed sensitive customer data without proper authorization.",
    actionTaken: "Revoked access, initiated internal investigation.",
  },
  {
    id: "PV003",
    policyName: "Software Installation Policy",
    agentId: "Agent-010",
    severity: "Low",
    status: "Resolved",
    timestamp: "2024-07-22 09:00 AM",
    description: "Unauthorized software installation detected.",
    actionTaken: "Uninstalled software, user re-educated on policy.",
  },
  {
    id: "PV004",
    policyName: "Network Segmentation Compliance",
    agentId: "Agent-003",
    severity: "High",
    status: "Open",
    timestamp: "2024-07-21 11:45 AM",
    description: "Agent attempted to bridge segmented networks.",
    actionTaken: "Isolated agent, reviewing network configuration.",
  },
  {
    id: "PV005",
    policyName: "Password Policy Enforcement",
    agentId: "Agent-007",
    severity: "Medium",
    status: "Open",
    timestamp: "2024-07-20 02:00 PM",
    description: "Weak password detected for a critical system account.",
    actionTaken: "Forced password reset, notified user.",
  },
]

export function PolicyViolations() {
  // Corrected export name
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRowClick = (violation: Violation) => {
    setSelectedViolation(violation)
    setIsModalOpen(true)
  }

  const getSeverityIcon = (severity: Violation["severity"]) => {
    switch (severity) {
      case "High":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "Medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "Low":
        return <Info className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusBadgeVariant = (status: Violation["status"]) => {
    switch (status) {
      case "Open":
        return "destructive"
      case "Resolved":
        return "default"
      case "Acknowledged":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <CardTitle>Recent Policy Violations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Policy Name</TableHead>
              <TableHead>Agent ID</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialViolations.map((violation) => (
              <TableRow
                key={violation.id}
                onClick={() => handleRowClick(violation)}
                className="cursor-pointer hover:bg-muted/50"
              >
                <TableCell className="font-medium">{violation.policyName}</TableCell>
                <TableCell>{violation.agentId}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(violation.severity)}
                    {violation.severity}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(violation.status)}>{violation.status}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{violation.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {selectedViolation && (
        <ViolationDetailsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} violation={selectedViolation} />
      )}
    </Card>
  )
}
