"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Download, FileText, Printer } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

type Report = {
  id: string
  type: string
  title: string
  status: "generating" | "completed" | "failed"
  createdAt: number
}

export function ReportsTab() {
  const { user } = useAuth()
  const isAnalyst = user?.role === "analyst"
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedReportType, setSelectedReportType] = useState<string>("")

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const response = await fetch("/api/reports/list")
      if (response.ok) {
        const data = await response.json()
        setReports(data)
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    if (!selectedReportType) {
      toast.error("Please select a report type")
      return
    }
    setGenerating(true)
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: selectedReportType }),
      })
      if (response.ok) {
        toast.success("Report generation started")
        fetchReports()
        setSelectedReportType("")
      } else {
        toast.error("Failed to generate report")
      }
    } catch (error) {
      console.error("Generate report error:", error)
      toast.error("Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const downloadReport = async (reportId: string, reportType: string) => {
    try {
      const response = await fetch(`/api/reports/${reportType}/download?id=${reportId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.style.display = "none"
        a.href = url
        a.download = `${reportType}-report-${new Date().toISOString().split("T")[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success("Report downloaded successfully")
      } else {
        toast.error("Failed to download report")
      }
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download report")
    }
  }

  const printReport = async (reportId: string, reportType: string) => {
    try {
      const response = await fetch(`/api/reports/${reportType}?id=${reportId}`)
      if (response.ok) {
        const data = await response.json()
        const printWindow = window.open("", "_blank")
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>${data.title}</title>
                <style>
                  body { font-family: Arial, sans-serif; margin: 20px; }
                  h1 { color: #333; }
                  .meta { color: #666; margin-bottom: 20px; }
                </style>
              </head>
              <body>
                <h1>${data.title}</h1>
                <div class="meta">Generated: ${new Date(data.createdAt).toLocaleString()}</div>
                <div>${data.content || "Report content will be displayed here"}</div>
              </body>
            </html>
          `)
          printWindow.document.close()
          printWindow.print()
        }
        toast.success("Report sent to printer")
      } else {
        toast.error("Failed to print report")
      }
    } catch (error) {
      console.error("Print error:", error)
      toast.error("Failed to print report")
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Generate Compliance Report</CardTitle>
          <CardDescription>Templates for SOC 2 and GDPR included</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Select value={selectedReportType} onValueChange={setSelectedReportType}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="soc2">SOC 2</SelectItem>
                <SelectItem value="gdpr">GDPR</SelectItem>
                <SelectItem value="security-audit">Security Audit</SelectItem>
                <SelectItem value="compliance-check">Compliance Check</SelectItem>
                <SelectItem value="threat-analysis">Threat Analysis</SelectItem>
                <SelectItem value="agent-security">Agent Security</SelectItem>
                <SelectItem value="policy-violations">Policy Violations</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateReport} disabled={isAnalyst || generating || !selectedReportType}>
              <FileText className="mr-2 h-4 w-4" />
              {generating ? "Generating..." : "Generate Report"}
            </Button>
          </div>
          {isAnalyst && (
            <div className="text-xs text-muted-foreground">
              Analyst role is read-only. Ask an Admin to generate reports.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Download or print previously generated reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="space-y-1">
                    <div className="h-4 bg-muted rounded animate-pulse w-48" />
                    <div className="h-3 bg-muted rounded animate-pulse w-32" />
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 w-20 bg-muted rounded animate-pulse" />
                    <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-4" />
              <p>No reports generated yet</p>
              <p className="text-sm">Generate your first compliance report above</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border rounded">
                  <div className="space-y-1">
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Generated: {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={
                        report.status === "completed"
                          ? "default"
                          : report.status === "failed"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {report.status}
                    </Badge>
                    {report.status === "completed" && (
                      <>
                        <Button variant="outline" size="sm" onClick={() => downloadReport(report.id, report.type)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => printReport(report.id, report.type)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
