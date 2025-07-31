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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const initialIncidents = [
  {
    id: "INC001",
    title: "Unauthorized Data Exfiltration Attempt",
    severity: "Critical",
    status: "Open",
    reportedBy: "System",
    timestamp: "2023-07-25 10:30 AM",
    description: "An attempt to exfiltrate sensitive customer data was detected and blocked.",
    resolution: "",
  },
  {
    id: "INC002",
    title: "AI Model Drift Detected",
    severity: "High",
    status: "In Progress",
    reportedBy: "AI-Monitor",
    timestamp: "2023-07-24 14:00 PM",
    description: "Performance degradation observed in financial fraud detection model.",
    resolution: "Investigating data input and model retraining schedule.",
  },
  {
    id: "INC003",
    title: "Policy Violation - Agent Misconfiguration",
    severity: "Medium",
    status: "Resolved",
    reportedBy: "Audit Log",
    timestamp: "2023-07-23 09:15 AM",
    description: "Agent deployed with incorrect access permissions, leading to a minor policy breach.",
    resolution: "Agent reconfigured and redeployed. Incident closed.",
  },
  {
    id: "INC004",
    title: "System Outage - Analytics Service",
    severity: "High",
    status: "Open",
    reportedBy: "Monitoring",
    timestamp: "2023-07-25 11:00 AM",
    description: "The main analytics service is unresponsive, impacting dashboard data.",
    resolution: "",
  },
]

export function IncidentDashboard() {
  const [incidents, setIncidents] = useState(initialIncidents)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [resolutionText, setResolutionText] = useState("")

  const handleViewDetails = (incident) => {
    setSelectedIncident(incident)
    setIsDetailsModalOpen(true)
  }

  const handleResolveClick = (incident) => {
    setSelectedIncident(incident)
    setResolutionText(incident.resolution || "")
    setIsResolveModalOpen(true)
  }

  const handleSaveResolution = () => {
    setIncidents(
      incidents.map((inc) =>
        inc.id === selectedIncident.id ? { ...inc, status: "Resolved", resolution: resolutionText } : inc,
      ),
    )
    setIsResolveModalOpen(false)
    setSelectedIncident(null)
    setResolutionText("")
  }

  const getSeverityBadgeVariant = (severity) => {
    switch (severity) {
      case "Critical":
        return "destructive"
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

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "Open":
        return "destructive"
      case "In Progress":
        return "default"
      case "Resolved":
        return "secondary"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reported By</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell className="font-medium">{incident.id}</TableCell>
                <TableCell>{incident.title}</TableCell>
                <TableCell>
                  <Badge variant={getSeverityBadgeVariant(incident.severity)}>{incident.severity}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(incident.status)}>{incident.status}</Badge>
                </TableCell>
                <TableCell>{incident.reportedBy}</TableCell>
                <TableCell>{incident.timestamp}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(incident)}>
                    View Details
                  </Button>
                  {incident.status !== "Resolved" && (
                    <Button variant="default" size="sm" onClick={() => handleResolveClick(incident)}>
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Incident Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Incident Details: {selectedIncident?.title}</DialogTitle>
            <DialogDescription>Comprehensive information about the selected incident.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">ID:</span>
              <span>{selectedIncident?.id}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Severity:</span>
              <span>{selectedIncident?.severity}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Status:</span>
              <span>{selectedIncident?.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Reported By:</span>
              <span>{selectedIncident?.reportedBy}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Timestamp:</span>
              <span>{selectedIncident?.timestamp}</span>
            </div>
            {selectedIncident?.description && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedIncident.description}</p>
                </div>
              </>
            )}
            {selectedIncident?.resolution && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Resolution:</span>
                  <p className="text-muted-foreground mt-1">{selectedIncident.resolution}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Resolve Incident Modal */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Incident: {selectedIncident?.title}</DialogTitle>
            <DialogDescription>Provide details about how this incident was resolved.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="resolution" className="text-right">
                Resolution Details
              </Label>
              <Textarea
                id="resolution"
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="col-span-3"
                placeholder="Describe the steps taken to resolve the incident."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveResolution}>Mark as Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
