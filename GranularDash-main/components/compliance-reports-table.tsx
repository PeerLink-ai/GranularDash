"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download } from "lucide-react"

const initialReports = [
  {
    id: "CR001",
    name: "GDPR Compliance Report Q2 2023",
    date: "2023-07-15",
    status: "Completed",
    type: "Quarterly",
    downloadLink: "#",
  },
  {
    id: "CR002",
    name: "SOC 2 Type II Audit Report 2022",
    date: "2023-01-30",
    status: "Completed",
    type: "Annual",
    downloadLink: "#",
  },
  {
    id: "CR003",
    name: "HIPAA Compliance Assessment",
    date: "2023-06-01",
    status: "In Progress",
    type: "Ad-hoc",
    downloadLink: "#",
  },
  {
    id: "CR004",
    name: "PCI DSS Compliance Scan",
    date: "2023-07-20",
    status: "Completed",
    type: "Monthly",
    downloadLink: "#",
  },
  {
    id: "CR005",
    name: "Internal Policy Adherence Review",
    date: "2023-07-10",
    status: "Completed",
    type: "Internal",
    downloadLink: "#",
  },
]

export function ComplianceReportsTable() {
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)

  const handleViewReport = (report) => {
    setSelectedReport(report)
    setIsViewModalOpen(true)
  }

  const handleDownloadReport = (report) => {
    // In a real application, this would trigger a file download
    alert(`Downloading report: ${report.name}`)
    window.open(report.downloadLink, "_blank")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Report Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialReports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.name}</TableCell>
                <TableCell>{report.date}</TableCell>
                <TableCell>{report.status}</TableCell>
                <TableCell>{report.type}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                    View Report
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report)}>
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Preview of the compliance report. (In a real application, this would load the actual report content, e.g.,
              PDF viewer)
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 border rounded-md bg-muted/20 text-muted-foreground flex items-center justify-center">
            {selectedReport ? (
              <p>Placeholder for report content for "{selectedReport.name}".</p>
            ) : (
              <p>No report selected.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
