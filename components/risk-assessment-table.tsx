"use client"

import { useState, useEffect } from "react"
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
import { Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface RiskAssessment {
  id: string
  user_id: string
  organization: string
  name: string
  category: string
  severity: "low" | "medium" | "high" | "critical"
  status: "open" | "in_review" | "mitigated" | "acknowledged" | "closed"
  description?: string
  mitigation_strategy?: string
  last_assessed: string
  created_at: string
}

export function RiskAssessmentTable() {
  const { user } = useAuth()
  const [risks, setRisks] = useState<RiskAssessment[]>([])
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isMitigateModalOpen, setIsMitigateModalOpen] = useState(false)
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization) {
      fetchRisks()
    }
  }, [user])

  const fetchRisks = async () => {
    try {
      const response = await fetch(`/api/risk-assessments?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        setRisks(data)
      }
    } catch (error) {
      console.error("Failed to fetch risk assessments:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (risk: RiskAssessment) => {
    setSelectedRisk(risk)
    setIsDetailsModalOpen(true)
  }

  const handleMitigateRisk = (risk: RiskAssessment) => {
    setSelectedRisk(risk)
    setIsMitigateModalOpen(true)
  }

  const confirmMitigation = async () => {
    if (!selectedRisk) return

    try {
      const response = await fetch(`/api/risk-assessments/${selectedRisk.id}/mitigate`, {
        method: "PATCH",
      })
      if (response.ok) {
        await fetchRisks() // Refresh the list
      }
    } catch (error) {
      console.error("Failed to mitigate risk:", error)
    }

    setIsMitigateModalOpen(false)
    setSelectedRisk(null)
  }

  const handleCreateRisk = () => {
    // This would open a modal to create a new risk assessment
    alert("Create new risk assessment functionality would be implemented here")
  }

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Assessments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading risk assessments...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Risk Assessments</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCreateRisk}>
            <Plus className="h-4 w-4 mr-2" />
            Create Assessment
          </Button>
        </CardHeader>
        <CardContent>
          {risks.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No risk assessments found. Create your first assessment to get started.
              </div>
              <Button variant="outline" onClick={handleCreateRisk}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Assessment
              </Button>
            </div>
          ) : (
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
                {risks.map((risk) => (
                  <TableRow key={risk.id}>
                    <TableCell className="font-medium">{risk.name}</TableCell>
                    <TableCell>{risk.category}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityBadgeVariant(risk.severity)}>{risk.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          risk.status === "mitigated"
                            ? "bg-green-100 text-green-800"
                            : risk.status === "in_review"
                              ? "bg-blue-100 text-blue-800"
                              : risk.status === "open"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {risk.status}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(risk.last_assessed).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(risk)}>
                        View Details
                      </Button>
                      {risk.status === "open" && (
                        <Button variant="default" size="sm" onClick={() => handleMitigateRisk(risk)}>
                          Mitigate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
              <span>{selectedRisk ? new Date(selectedRisk.last_assessed).toLocaleDateString() : ""}</span>
            </div>
            {selectedRisk?.description && (
              <div className="col-span-2">
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground mt-1">{selectedRisk.description}</p>
              </div>
            )}
            {selectedRisk?.mitigation_strategy && (
              <div className="col-span-2">
                <span className="font-medium">Mitigation Strategy:</span>
                <p className="text-muted-foreground mt-1">{selectedRisk.mitigation_strategy}</p>
              </div>
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
    </>
  )
}
