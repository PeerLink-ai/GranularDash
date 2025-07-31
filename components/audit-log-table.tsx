"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { AuditLogDetailsModal } from "./audit-log-details-modal"

const initialAuditLogs = [
  {
    id: "AL001",
    timestamp: "2023-07-25 14:30:00",
    userOrAgent: "AdminUser",
    action: "Policy Update",
    resource: "Data Privacy Policy",
    status: "Success",
    ipAddress: "192.168.1.100",
    details: "Updated policy rules for GDPR compliance.",
  },
  {
    id: "AL002",
    timestamp: "2023-07-25 10:15:00",
    userOrAgent: "AI-Finance-001",
    action: "Data Access",
    resource: "Financial Records",
    status: "Failed",
    ipAddress: "10.0.0.5",
    details: "Attempted to access restricted financial data without proper credentials.",
  },
  {
    id: "AL003",
    timestamp: "2023-07-24 16:00:00",
    userOrAgent: "System",
    action: "Agent Deployment",
    resource: "AI-HR-002",
    status: "Success",
    ipAddress: "N/A",
    details: "New HR agent deployed to production environment.",
  },
  {
    id: "AL004",
    timestamp: "2023-07-24 09:45:00",
    userOrAgent: "UserJane",
    action: "Login",
    resource: "Dashboard",
    status: "Success",
    ipAddress: "203.0.113.45",
    details: "User successfully logged in.",
  },
  {
    id: "AL005",
    timestamp: "2023-07-23 11:20:00",
    userOrAgent: "AI-Marketing-006",
    action: "Content Generation",
    resource: "Marketing Campaign A",
    status: "Success",
    ipAddress: "172.16.0.1",
    details: "Generated marketing content for Q3 campaign.",
  },
]

export function AuditLogTable() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setIsModalOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User/Agent</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialAuditLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.timestamp}</TableCell>
                <TableCell>{log.userOrAgent}</TableCell>
                <TableCell>{log.action}</TableCell>
                <TableCell>{log.resource}</TableCell>
                <TableCell>{log.status}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <AuditLogDetailsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} log={selectedLog} />
    </Card>
  )
}
