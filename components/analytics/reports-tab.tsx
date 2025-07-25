"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Printer } from "lucide-react"

const reportTypes = [
  "Compliance Audit Report",
  "Agent Activity Log",
  "Behavioral Anomaly Summary",
  "Risk Assessment Report",
  "Policy Adherence Report",
  "Resource Utilization Report",
]

const dummyReportData = {
  "Compliance Audit Report": [
    { id: 1, metric: "Total Agents Audited", value: "750" },
    { id: 2, metric: "Policies Reviewed", value: "45" },
    { id: 3, metric: "Critical Violations", value: "3" },
    { id: 4, metric: "Audit Readiness Score", value: "92%" },
    { id: 5, metric: "Next Scheduled Audit", value: "Q4 2024" },
  ],
  "Agent Activity Log": [
    { id: 1, metric: "Total Actions Recorded", value: "1,234,567" },
    { id: 2, metric: "Unique Agents Active", value: "750" },
    { id: 3, metric: "Average Actions per Agent", value: "1,646" },
    { id: 4, metric: "Peak Activity Time", value: "10:00 AM UTC" },
    { id: 5, metric: "Data Volume Processed", value: "500 GB" },
  ],
  "Behavioral Anomaly Summary": [
    { id: 1, metric: "Total Anomalies Detected", value: "250" },
    { id: 2, metric: "Resolved Anomalies", value: "220" },
    { id: 3, metric: "Open Anomalies", value: "30" },
    { id: 4, metric: "Goal Drift Incidents", value: "7" },
    { id: 5, metric: "Collusion Attempts", value: "2" },
  ],
  "Risk Assessment Report": [
    { id: 1, metric: "Overall Risk Score", value: "Low" },
    { id: 2, metric: "High-Risk Agents", value: "5" },
    { id: 3, metric: "Identified Vulnerabilities", value: "12" },
    { id: 4, metric: "Mitigation Progress", value: "70%" },
    { id: 5, metric: "Last Assessment Date", value: "2023-07-01" },
  ],
  "Policy Adherence Report": [
    { id: 1, metric: "Overall Adherence Rate", value: "98.5%" },
    { id: 2, metric: "Non-Compliant Agents", value: "12" },
    { id: 3, metric: "Top Violated Policies", value: "Data Privacy, Ethical Use" },
    { id: 4, metric: "Policy Enforcement Actions", value: "50" },
    { id: 5, metric: "Policy Update Frequency", value: "Monthly" },
  ],
  "Resource Utilization Report": [
    { id: 1, metric: "Total CPU Usage", value: "75%" },
    { id: 2, metric: "Total Memory Usage", value: "60%" },
    { id: 3, metric: "Network Throughput", value: "1.5 Gbps" },
    { id: 4, metric: "Storage Consumption", value: "2 TB" },
    { id: 5, metric: "Cost Efficiency", value: "High" },
  ],
}

export function ReportsTab() {
  const [selectedReport, setSelectedReport] = useState(reportTypes[0])

  const handleGenerateReport = () => {
    console.log(`Generating ${selectedReport} report...`)
  }

  const handleDownloadReport = () => {
    console.log(`Downloading ${selectedReport} report...`)
  }

  const handlePrintReport = () => {
    console.log(`Printing ${selectedReport} report...`)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center space-x-4">
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleGenerateReport}>Generate Report</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">{selectedReport} Report</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dummyReportData[selectedReport]?.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.metric}</TableCell>
                  <TableCell>{row.value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleDownloadReport}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
