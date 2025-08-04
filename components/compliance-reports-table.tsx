"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, Plus } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface ComplianceReport {
  id: string
  user_id: string
  organization: string
  name: string
  type: "quarterly" | "annual" | "ad-hoc" | "monthly" | "internal"
  status: "draft" | "in_progress" | "completed" | "failed"
  content: Record<string, any>
  file_path?: string
  created_at: string
  completed_at?: string
}

export function ComplianceReportsTable() {
  const { user } = useAuth()
  const [reports, setReports] = useState<ComplianceReport[]>([])
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ComplianceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization) {
      fetchReports()
    }
  }, [user])

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/compliance-reports?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error("Failed to fetch compliance reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewReport = (report: ComplianceReport) => {
    setSelectedReport(report)
    setIsViewModalOpen(true)
  }

  const handleDownloadReport = (report: ComplianceReport) => {
    if (report.file_path) {
      window.open(report.file_path, "_blank")
    } else {
      alert(`Report "${report.name}" is not yet available for download.`)
    }
  }

  const handleCreateReport = () => {
    // This would open a modal to create a new report
    alert("Create new report functionality would be implemented here")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Compliance Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading reports...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>Compliance Reports</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCreateReport}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No compliance reports found. Create your first report to get started.
              </div>
              <Button variant="outline" onClick={handleCreateReport}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Report
              </Button>
            </div>
          ) : (
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
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>{new Date(report.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          report.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : report.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : report.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {report.status}
                      </span>
                    </TableCell>
                    <TableCell>{report.type}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                        View Report
                      </Button>
                      {report.status === "completed" && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownloadReport(report)}>
                          <Download className="h-4 w-4 mr-2" /> Download
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

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[800px] h-[70vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedReport?.name}</DialogTitle>
            <DialogDescription>
              Preview of the compliance report.
              {selectedReport?.status !== "completed" && " (Report is still being generated)"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto p-4 border rounded-md bg-muted/20 text-muted-foreground flex items-center justify-center">
            {selectedReport ? (
              selectedReport.status === "completed" ? (
                <div className="text-center">
                  <p>Report content would be displayed here.</p>
                  <p className="text-sm mt-2">
                    In a real application, this would show the actual report content or PDF viewer.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <p>
                    Report "{selectedReport.name}" is currently {selectedReport.status}.
                  </p>
                  <p className="text-sm mt-2">Please check back later when the report is completed.</p>
                </div>
              )
            ) : (
              <p>No report selected.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
