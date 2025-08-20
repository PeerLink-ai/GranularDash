"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, RefreshCw, Brain, Eye } from "lucide-react"
import { AIThoughtDetailsModal } from "./ai-thought-details-modal"

interface AIThoughtProcessLog {
  id: number
  agent_id: string
  session_id?: string
  thought_type: string
  prompt?: string
  thought_content: string
  context_data?: Record<string, any>
  confidence_score?: number
  reasoning_steps?: string[]
  decision_factors?: Record<string, any>
  processing_time_ms?: number
  model_used?: string
  created_at: string
}

const thoughtTypeColors = {
  reasoning: "bg-blue-100 text-blue-800",
  decision: "bg-green-100 text-green-800",
  analysis: "bg-purple-100 text-purple-800",
  planning: "bg-orange-100 text-orange-800",
  reflection: "bg-gray-100 text-gray-800",
}

export function AIThoughtProcessTable() {
  const [thoughtLogs, setThoughtLogs] = useState<AIThoughtProcessLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AIThoughtProcessLog[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedThoughtType, setSelectedThoughtType] = useState<string>("all")
  const [selectedLog, setSelectedLog] = useState<AIThoughtProcessLog | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchThoughtLogs()
  }, [])

  useEffect(() => {
    let filtered = thoughtLogs.filter(
      (log) =>
        log.thought_content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.agent_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.prompt && log.prompt.toLowerCase().includes(searchTerm.toLowerCase())),
    )

    if (selectedThoughtType !== "all") {
      filtered = filtered.filter((log) => log.thought_type === selectedThoughtType)
    }

    setFilteredLogs(filtered)
  }, [thoughtLogs, searchTerm, selectedThoughtType])

  const fetchThoughtLogs = async () => {
    try {
      const response = await fetch("/api/ai-thought-logs")
      if (response.ok) {
        const data = await response.json()
        setThoughtLogs(data.logs)
      }
    } catch (error) {
      console.error("Failed to fetch AI thought logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (log: AIThoughtProcessLog) => {
    setSelectedLog(log)
    setIsDetailsModalOpen(true)
  }

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-100 text-gray-800"
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Thought Process Audit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse text-muted-foreground">Loading thought process logs...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Thought Process Audit
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search thoughts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
                aria-label="Search thought logs"
              />
              <Search
                className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <Select value={selectedThoughtType} onValueChange={setSelectedThoughtType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="reasoning">Reasoning</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="reflection">Reflection</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchThoughtLogs()} aria-label="Refresh logs">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {thoughtLogs.length === 0
                ? "No AI thought process logs found. Agent reasoning will appear here as AI agents make decisions."
                : "No logs match your search criteria."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Agent ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Thought Content</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">{new Date(log.created_at).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-sm">{log.agent_id}</TableCell>
                    <TableCell>
                      <Badge className={thoughtTypeColors[log.thought_type as keyof typeof thoughtTypeColors]}>
                        {log.thought_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      <div className="truncate" title={log.thought_content}>
                        {log.thought_content}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.confidence_score && (
                        <Badge className={getConfidenceColor(log.confidence_score)}>
                          {Math.round(log.confidence_score * 100)}%
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{log.model_used || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(log)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AIThoughtDetailsModal
        log={selectedLog}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />
    </>
  )
}
