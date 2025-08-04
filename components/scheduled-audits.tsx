"use client"

import { useState, useEffect } from "react"
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
import { CalendarDays, Plus } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/contexts/auth-context"

interface ScheduledAudit {
  id: string
  user_id: string
  organization: string
  name: string
  audit_date: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  lead_auditor?: string
  scope?: string
  created_at: string
}

export function ScheduledAudits() {
  const { user } = useAuth()
  const [audits, setAudits] = useState<ScheduledAudit[]>([])
  const [selectedAudit, setSelectedAudit] = useState<ScheduledAudit | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization) {
      fetchAudits()
    }
  }, [user])

  const fetchAudits = async () => {
    try {
      const response = await fetch(`/api/scheduled-audits?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        setAudits(data)
      }
    } catch (error) {
      console.error("Failed to fetch scheduled audits:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (audit: ScheduledAudit) => {
    setSelectedAudit(audit)
    setIsDetailsModalOpen(true)
  }

  const handleCreateAudit = () => {
    // This would open a modal to create a new audit
    alert("Create new audit functionality would be implemented here")
  }

  // Prepare audit dates for the calendar
  const auditDates = audits.map((audit) => new Date(audit.audit_date))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md font-medium">Scheduled Audits & Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading audits...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">Scheduled Audits & Reviews</CardTitle>
          <div className="flex space-x-2">
            {audits.length > 0 && (
              <Button variant="outline" size="sm" onClick={() => setIsCalendarModalOpen(true)}>
                <CalendarDays className="h-4 w-4 mr-2" />
                View Calendar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleCreateAudit}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Audit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {audits.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-muted-foreground mb-4">
                No audits scheduled. Schedule your first audit to get started.
              </div>
              <Button variant="outline" onClick={handleCreateAudit}>
                <Plus className="h-4 w-4 mr-2" />
                Schedule Your First Audit
              </Button>
            </div>
          ) : (
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
                {audits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell className="font-medium">{audit.name}</TableCell>
                    <TableCell>{new Date(audit.audit_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          audit.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : audit.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : audit.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {audit.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(audit)}>
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>

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
                  <span className="col-span-3">{new Date(selectedAudit.audit_date).toLocaleDateString()}</span>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="text-sm font-medium col-span-1">Status:</span>
                  <span className="col-span-3">{selectedAudit.status}</span>
                </div>
                {selectedAudit.lead_auditor && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <span className="text-sm font-medium col-span-1">Lead:</span>
                    <span className="col-span-3">{selectedAudit.lead_auditor}</span>
                  </div>
                )}
                {selectedAudit.scope && (
                  <div className="grid grid-cols-4 items-start gap-4">
                    <span className="text-sm font-medium col-span-1">Scope:</span>
                    <span className="col-span-3">{selectedAudit.scope}</span>
                  </div>
                )}
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
      </Card>
    </>
  )
}
