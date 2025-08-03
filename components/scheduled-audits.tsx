"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"

interface ScheduledAudit {
  id: string
  name: string
  date: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  auditor: string
}

export function ScheduledAudits() {
  const { user } = useAuth()
  const [audits, setAudits] = useState<ScheduledAudit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAudits = async () => {
      if (!user || !user.permissions.includes("view_reports")) {
        setIsLoading(false)
        return
      }
      setIsLoading(true)
      setError(null)
      try {
        // Simulate fetching scheduled audits
        // In a real application, this would be an API call to an audit scheduling service
        const mockAudits: ScheduledAudit[] = [
          {
            id: "audit-001",
            name: "Q3 Compliance Review",
            date: "2024-09-15",
            status: "scheduled",
            auditor: "Internal Audit Team",
          },
          {
            id: "audit-002",
            name: "AI Model Bias Check",
            date: "2024-08-01",
            status: "in_progress",
            auditor: "External Firm A",
          },
          {
            id: "audit-003",
            name: "Data Governance Audit",
            date: "2024-07-20",
            status: "completed",
            auditor: "Internal Audit Team",
          },
          {
            id: "audit-004",
            name: "Agent Performance Review",
            date: "2024-08-10",
            status: "scheduled",
            auditor: "External Firm B",
          },
        ]
        setAudits(mockAudits)
      } catch (err) {
        setError("Failed to load scheduled audits.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAudits()
    const interval = setInterval(fetchAudits, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [user])

  if (!user) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "scheduled":
        return "outline"
      case "in_progress":
        return "default"
      case "completed":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scheduled Audits</CardTitle>
        <CardDescription>Upcoming and in-progress AI governance audits.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">
            <AlertTriangle className="mx-auto h-12 w-12 mb-2" />
            <p className="text-sm">{error}</p>
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p className="text-sm">No scheduled audits found.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Audit Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Auditor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {audits.map((audit) => (
                <TableRow key={audit.id}>
                  <TableCell className="font-medium">{audit.name}</TableCell>
                  <TableCell>{new Date(audit.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(audit.status)}>{audit.status.replace("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>{audit.auditor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
