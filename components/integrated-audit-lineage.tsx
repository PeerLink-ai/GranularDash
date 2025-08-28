"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, GitBranch, Activity, Eye, ExternalLink } from "lucide-react"
import { DataModelLineage } from "./data-model-lineage"
import { AuditLogTable } from "./audit-log-table"

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Integrated Audit & Lineage Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="timeline">Unified Timeline</TabsTrigger>
              <TabsTrigger value="lineage">Lineage View</TabsTrigger>
              <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Input
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
                <Button variant="outline" onClick={fetchIntegratedData}>
                  Refresh
                </Button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={event.type === "audit" ? "default" : "secondary"}>
                            {event.type === "audit" ? (
                              <Activity className="h-3 w-3 mr-1" />
                            ) : (
                              <GitBranch className="h-3 w-3 mr-1" />
                            )}
                            {event.type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>

                        {event.relatedNodes.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-muted-foreground">Related:</span>
                            {event.relatedNodes.map((nodeId) => (
                              <Button
                                key={nodeId}
                                variant="outline"
                                size="sm"
                                className="h-6 px-2 text-xs bg-transparent"
                                onClick={() => handleResourceClick(nodeId)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {nodeId.split("-")[1]?.slice(0, 8)}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}

                {filteredEvents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No events found matching your search criteria.
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lineage">
              <DataModelLineage highlightedNode={selectedResourceId} />
            </TabsContent>

            <TabsContent value="audit">
              <AuditLogTable />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
