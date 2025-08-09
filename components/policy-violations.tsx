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
import { PauseAgentModal } from "@/components/pause-agent-modal"
import { TicketPlus, PauseCircle, FileText } from "lucide-react"
import { toast } from "sonner"

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
  const [pauseOpen, setPauseOpen] = useState(false)
  const [activeAgentsCount, setActiveAgentsCount] = useState(0)
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.organization) {
      fetchViolations()
      fetchAgentsCount()
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

  const fetchAgentsCount = async () => {
    try {
      const response = await fetch(`/api/agents`)
      if (response.ok) {
        const data = await response.json()
        setActiveAgentsCount((data.agents || []).length)
      }
    } catch {
      setActiveAgentsCount(0)
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

  async function openJira(violation: PolicyViolation) {
    try {
      const res = await fetch("/api/integrations/tickets/jira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[${violation.severity.toUpperCase()}] Policy violation: ${violation.policy_name}`,
          description: `${violation.description}\nAgent: ${violation.agent_id || "System"}\nDetected: ${new Date(violation.detected_at).toISOString()}`,
          severity: violation.severity,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to open ticket")
      toast.success(`Jira ticket created (#${data.key})`)
    } catch (e: any) {
      toast.error(e.message || "Failed to open ticket")
    }
  }

  async function openServiceNow(violation: PolicyViolation) {
    try {
      const res = await fetch("/api/integrations/tickets/servicenow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_description: `[${violation.severity.toUpperCase()}] ${violation.policy_name}`,
          description: violation.description,
          urgency: violation.severity,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to open incident")
      toast.success(`ServiceNow incident created (${data.number})`)
    } catch (e: any) {
      toast.error(e.message || "Failed to open incident")
    }
  }

  function handlePause(agentId?: string) {
    if (!agentId) {
      toast.error("No agent specified for pause")
      return
    }
    setSelectedAgentId(agentId)
    setPauseOpen(true)
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
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{violation.agent_id || "System"}</p>
                    <p className="text-xs text-muted-foreground truncate">{violation.policy_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(violation.severity)}>{violation.severity}</Badge>
                    <Button variant="outline" size="sm" onClick={() => openJira(violation)} title="Create Jira ticket">
                      <TicketPlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openServiceNow(violation)}
                      title="Create ServiceNow incident"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePause(violation.agent_id)}
                      title="Pause agent"
                    >
                      <PauseCircle className="h-4 w-4" />
                    </Button>
                  </div>
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
        <DialogContent className="sm:max-w-[900px]">
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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell>{new Date(violation.detected_at).toLocaleString()}</TableCell>
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
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openJira(violation)}
                          title="Create Jira ticket"
                        >
                          <TicketPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openServiceNow(violation)}
                          title="Create ServiceNow incident"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePause(violation.agent_id)}
                          title="Pause agent"
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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

      <PauseAgentModal
        isOpen={pauseOpen}
        onClose={() => setPauseOpen(false)}
        onPauseAgent={() => {
          toast.success(`Pause command sent${selectedAgentId ? ` to ${selectedAgentId}` : ""}`)
          setPauseOpen(false)
        }}
        activeAgents={activeAgentsCount}
      />
    </>
  )
}
