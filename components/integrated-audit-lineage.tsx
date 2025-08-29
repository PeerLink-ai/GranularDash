"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, GitBranch, Activity, ExternalLink } from "lucide-react"
import { DataModelLineage } from "./data-model-lineage"

interface AuditLog {
  id: string
  user_id: string
  organization: string
  action: string
  resource_type: string
  resource_id?: string
  details: Record<string, any>
  timestamp: string
}

interface LineageNode {
  id: string
  name: string
  type: string
  metadata: Record<string, any>
}

interface IntegratedEvent {
  id: string
  type: "audit" | "lineage"
  timestamp: string
  title: string
  description: string
  resourceType: string
  resourceId?: string
  relatedNodes: string[]
  auditLog?: AuditLog
  lineageNode?: LineageNode
}

export function IntegratedAuditLineage() {
  const [events, setEvents] = useState<IntegratedEvent[]>([])
  const [filteredEvents, setFilteredEvents] = useState<IntegratedEvent[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIntegratedData()
  }, [])

  useEffect(() => {
    const filtered = events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.resourceType.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredEvents(filtered)
  }, [events, searchTerm])

  const fetchIntegratedData = async () => {
    try {
      const [auditResponse, lineageResponse] = await Promise.all([fetch("/api/audit-logs"), fetch("/api/lineage")])

      const auditLogs = auditResponse.ok ? await auditResponse.json() : []
      const lineageData = lineageResponse.ok ? await lineageResponse.json() : { nodes: [], edges: [] }

      const integratedEvents: IntegratedEvent[] = []

      // Convert audit logs to integrated events
      auditLogs.forEach((log: AuditLog) => {
        integratedEvents.push({
          id: `audit-${log.id}`,
          type: "audit",
          timestamp: log.timestamp,
          title: `${log.action} on ${log.resource_type}`,
          description: log.details?.description || `${log.action} performed on ${log.resource_type}`,
          resourceType: log.resource_type,
          resourceId: log.resource_id,
          relatedNodes: findRelatedLineageNodes(log, lineageData.nodes),
          auditLog: log,
        })
      })

      // Convert lineage nodes to events (for recent activity)
      lineageData.nodes.forEach((node: LineageNode) => {
        if (node.metadata?.creationDate) {
          integratedEvents.push({
            id: `lineage-${node.id}`,
            type: "lineage",
            timestamp: new Date(node.metadata.creationDate).toISOString(),
            title: `${node.type} created: ${node.name}`,
            description: node.metadata?.description || `New ${node.type} added to system`,
            resourceType: node.type,
            resourceId: node.id,
            relatedNodes: [node.id],
            lineageNode: node,
          })
        }
      })

      // Sort by timestamp (most recent first)
      integratedEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

      setEvents(integratedEvents)
    } catch (error) {
      console.error("Failed to fetch integrated data:", error)
    } finally {
      setLoading(false)
    }
  }

  const findRelatedLineageNodes = (auditLog: AuditLog, lineageNodes: LineageNode[]): string[] => {
    const relatedNodes: string[] = []

    // Match by resource type and ID
    if (auditLog.resource_id) {
      const matchingNode = lineageNodes.find(
        (node) =>
          node.id.includes(auditLog.resource_id!) ||
          (auditLog.resource_type === "agent" && node.type === "agent") ||
          (auditLog.resource_type === "model" && node.type === "model"),
      )
      if (matchingNode) {
        relatedNodes.push(matchingNode.id)
      }
    }

    return relatedNodes
  }

  const handleResourceClick = (resourceId: string) => {
    setSelectedResourceId(resourceId)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Integrated Audit & Lineage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading integrated data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 relative">
      <DataModelLineage highlightedNode={selectedResourceId} showAuditOverlay={true} auditEvents={filteredEvents} />

      <Card className="absolute top-4 right-4 w-80 max-h-96 z-10">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="p-2 rounded border bg-card/50 hover:bg-card">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={event.type === "audit" ? "default" : "secondary"} className="h-4 text-xs">
                    {event.type === "audit" ? (
                      <Activity className="h-2 w-2 mr-1" />
                    ) : (
                      <GitBranch className="h-2 w-2 mr-1" />
                    )}
                    {event.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs font-medium">{event.title}</p>
                {event.relatedNodes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 px-1 text-xs mt-1"
                    onClick={() => handleResourceClick(event.relatedNodes[0])}
                  >
                    <ExternalLink className="h-2 w-2 mr-1" />
                    View in lineage
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
