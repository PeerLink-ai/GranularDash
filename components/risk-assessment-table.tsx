"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

const initialRisks = [
  {
    id: "R001",
    name: "Unauthorized Data Access",
    category: "Security",
    severity: "High",
    status: "Open",
    lastAssessed: "2023-07-20",
    mitigation: "Implement MFA for all sensitive systems.",
  },
  {
    id: "R002",
    name: "Compliance Violation (GDPR)",
    category: "Regulatory",
    severity: "Medium",
    status: "Mitigated",
    lastAssessed: "2023-07-18",
    mitigation: "Update data handling policies and retrain staff.",
  },
  {
    id: "R003",
    name: "System Downtime Risk",
    category: "Operational",
    severity: "Low",
    status: "Acknowledged",
    lastAssessed: "2023-07-15",
    mitigation: "Implement redundant systems and failover procedures.",
  },
  {
    id: "R004",
    name: "Supply Chain Vulnerability",
    category: "Third-Party",
    severity: "High",
    status: "Open",
    lastAssessed: "2023-07-22",
    mitigation: "Diversify suppliers and conduct regular vendor audits.",
  },
  {
    id: "R005",
    name: "AI Model Bias",
    category: "Ethical",
    severity: "Medium",
    status: "In Review",
    lastAssessed: "2023-07-21",
    mitigation: "Implement fairness metrics and regular model audits.",
  },
]

export function RiskAssessmentTable() {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isMitigateModalOpen, setIsMitigateModalOpen] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState(null)

  const handleViewDetails = (risk) => {
    setSelectedRisk(risk)
    setIsDetailsModalOpen(true)
  }

  const handleMitigateRisk = (risk) => {
    setSelectedRisk(risk)
    setIsMitigateModalOpen(true)
  }

  const confirmMitigation = () => {
    alert(`Simulating mitigation for risk: ${selectedRisk.name}`)
    // In a real app, this would update the risk status in a backend
    setIsMitigateModalOpen(false)
    setSelectedRisk(null)
  }

  const getSeverityBadgeVariant = (severity) => {
    switch (severity) {
      case "High":
        return "destructive"
      case "Medium":
        return "default"
      case "Low":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Assessments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Risk Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Assessed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialRisks.map((risk) => (
              <TableRow key={risk.id}>
                <TableCell className="font-medium">{risk.name}</TableCell>
                <TableCell>{risk.category}</TableCell>
                <TableCell>
                  <Badge variant={getSeverityBadgeVariant(risk.severity)}>{risk.severity}</Badge>
                </TableCell>
                <TableCell>{risk.status}</TableCell>
                <TableCell>{risk.lastAssessed}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(risk)}>
                    View Details
                  </Button>
                  {risk.status === "Open" && (
                    <Button variant="default" size="sm" onClick={() => handleMitigateRisk(risk)}>
                      Mitigate
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Risk Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Risk Details: {selectedRisk?.name}</DialogTitle>
            <DialogDescription>Comprehensive information about the selected risk.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Category:</span>
              <span>{selectedRisk?.category}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Severity:</span>
              <span>{selectedRisk?.severity}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Status:</span>
              <span>{selectedRisk?.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Last Assessed:</span>
              <span>{selectedRisk?.lastAssessed}</span>
            </div>
            {selectedRisk?.mitigation && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Mitigation Strategy:</span>
                  <p className="text-muted-foreground mt-1">{selectedRisk.mitigation}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mitigate Risk Confirmation Modal */}
      <Dialog open={isMitigateModalOpen} onOpenChange={setIsMitigateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Mitigation</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark "{selectedRisk?.name}" as mitigated? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMitigateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmMitigation}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
