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
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

interface PolicyViolation {
  id: string
  user_id: string
  organization: string
  agent_id?: string
  policy_name: string
  severity: "low" | "medium" | "high" | "critical"
  description: string
  status: "open" | "investigating" | "resolved" | "dismissed"
  detected_at: string
  resolved_at?: string
}

export function PolicyViolations() {
  const { user } = useAuth()
  const [violations, setViolations] = useState<PolicyViolation[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.organization) {
      fetchViolations()
    }
  }, [user])

  const fetchViolations = async () => {
    try {
      const response = await fetch(`/api/policy-violations?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        setViolations(data)
      }
    } catch (error) {
      console.error("Failed to fetch policy violations:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return "bg-red-500 text-white"
      case "medium":
        return "bg-yellow-500 text-black"
      case "low":
        return "bg-green-500 text-white"
      default:
        return "bg-gray-200 text-black"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md font-medium">Policy Violations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading violations...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-md font-medium">Policy Violations</CardTitle>
          {violations.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
              View All
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {violations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No policy violations detected. Your agents are operating within compliance guidelines.
            </div>
          ) : (
            <div className="space-y-4">
              {violations.slice(0, 3).map((violation) => (
                <div key={violation.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{violation.agent_id || "System"}</p>
                    <p className="text-xs text-muted-foreground">{violation.policy_name}</p>
                  </div>
                  <Badge className={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                </div>
              ))}
              {violations.length > 3 && (
                <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)} className="w-full">
                  View All {violations.length} Violations
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>All Policy Violations</DialogTitle>
            <DialogDescription>A comprehensive list of all detected policy violations.</DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Policy</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell className="font-medium">{violation.agent_id || "System"}</TableCell>
                    <TableCell>{violation.policy_name}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                    </TableCell>
                    <TableCell>{new Date(violation.detected_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          violation.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : violation.status === "investigating"
                              ? "bg-blue-100 text-blue-800"
                              : violation.status === "dismissed"
                                ? "bg-gray-100 text-gray-800"
                                : "bg-red-100 text-red-800"
                        }`}
                      >
                        {violation.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{violation.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
