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
} from "@/components/ui/dialog"
import { CalendarDays } from "lucide-react"
import { Calendar } from "@/components/ui/calendar" // Import the Calendar component

const scheduledAudits = [
  {
    id: "audit001",
    name: "Q4 2023 Financial Audit",
    date: "2023-11-15",
    status: "Scheduled",
    lead: "John Doe",
    scope: "Review of all financial transactions and reports for Q4 2023.",
  },
  {
    id: "audit002",
    name: "Annual Security Review",
    date: "2023-12-01",
    status: "Scheduled",
    lead: "Jane Smith",
    scope: "Comprehensive assessment of cybersecurity posture and controls.",
  },
  {
    id: "audit003",
    name: "AI Model Bias Review",
    date: "2024-01-10",
    status: "Pending",
    lead: "Alice Johnson",
    scope: "Evaluation of AI models for potential biases and fairness.",
  },
]

export function ScheduledAudits() {
  const [selectedAudit, setSelectedAudit] = useState<(typeof scheduledAudits)[0] | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false) // New state for calendar modal

  const handleViewDetails = (audit: (typeof scheduledAudits)[0]) => {
    setSelectedAudit(audit)
    setIsDetailsModalOpen(true)
  }

  // Prepare audit dates for the calendar
  const auditDates = scheduledAudits.map((audit) => new Date(audit.date))

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-md font-medium">Scheduled Audits & Reviews</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setIsCalendarModalOpen(true)}>
          <CalendarDays className="h-4 w-4 mr-2" />
          View Calendar
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Audit Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledAudits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="font-medium">{audit.name}</TableCell>
                <TableCell>{audit.date}</TableCell>
                <TableCell>{audit.status}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(audit)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Audit Details Dialog */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedAudit?.name} Details</DialogTitle>
              <DialogDescription>Detailed information about the scheduled audit.</DialogDescription>
            </DialogHeader>
            {selectedAudit && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium col-span-1">Date:</span>
                  <span className="col-span-3">{selectedAudit.date}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium col-span-1">Status:</span>
                  <span className="col-span-3">{selectedAudit.status}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium col-span-1">Lead:</span>
                  <span className="col-span-3">{selectedAudit.lead}</span>
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <span className="text-sm font-medium col-span-1">Scope:</span>
                  <span className="col-span-3">{selectedAudit.scope}</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Calendar View Dialog */}
        <Dialog open={isCalendarModalOpen} onOpenChange={setIsCalendarModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Scheduled Audits Calendar</DialogTitle>
              <DialogDescription>View all scheduled audit dates on the calendar.</DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <Calendar mode="multiple" selected={auditDates} className="rounded-md border" />
            </div>
            <DialogFooter>
              <Button onClick={() => setIsCalendarModalOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
