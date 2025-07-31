"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExternalLink, CheckCircle, RefreshCw } from "lucide-react"

type DriftEvent = {
  id: string
  timestamp: string
  metric: string
  feature: string
  severity: "Low" | "Medium" | "High" | "Critical"
  status: "Resolved" | "Unresolved" | "Acknowledged"
}

const mockDriftEvents: DriftEvent[] = [
  {
    id: "1",
    timestamp: "2024-07-20 10:30",
    metric: "Input Distribution",
    feature: "Age",
    severity: "High",
    status: "Unresolved",
  },
  {
    id: "2",
    timestamp: "2024-07-19 14:00",
    metric: "Target Accuracy",
    feature: "Overall",
    severity: "Critical",
    status: "Unresolved",
  },
  {
    id: "3",
    timestamp: "2024-07-18 09:15",
    metric: "Input Distribution",
    feature: "Income",
    severity: "Medium",
    status: "Acknowledged",
  },
  {
    id: "4",
    timestamp: "2024-07-17 11:45",
    metric: "Target Accuracy",
    feature: "Region",
    severity: "Low",
    status: "Resolved",
  },
  {
    id: "5",
    timestamp: "2024-07-16 16:20",
    metric: "Input Distribution",
    feature: "Education",
    severity: "High",
    status: "Unresolved",
  },
  {
    id: "6",
    timestamp: "2024-07-15 08:00",
    metric: "Target Accuracy",
    feature: "Overall",
    severity: "Critical",
    status: "Acknowledged",
  },
]

export function DriftEventsTable() {
  const [filterStatus, setFilterStatus] = useState<string>("All")
  const [filterSeverity, setFilterSeverity] = useState<string>("All")
  const [filterFeature, setFilterFeature] = useState<string>("All")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [events, setEvents] = useState<DriftEvent[]>(mockDriftEvents)

  const getSeverityBadge = (severity: DriftEvent["severity"]) => {
    switch (severity) {
      case "Low":
        return <Badge variant="outline">Low</Badge>
      case "Medium":
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Medium</Badge>
      case "High":
        return <Badge className="bg-orange-500 text-white hover:bg-orange-600">High</Badge>
      case "Critical":
        return <Badge className="bg-red-500 text-white hover:bg-red-600">Critical</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const getStatusBadge = (status: DriftEvent["status"]) => {
    switch (status) {
      case "Resolved":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Resolved
          </Badge>
        )
      case "Acknowledged":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
            Acknowledged
          </Badge>
        )
      case "Unresolved":
        return (
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            Unresolved
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const handleAcknowledge = (id: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === id ? { ...event, status: "Acknowledged" } : event)),
    )
    alert(`Event ${id} acknowledged!`)
  }

  const handleCreateTicket = (id: string) => {
    // In a real app, this would link to Jira/ServiceNow
    alert(`Creating ticket for event ${id}... (Simulated link to Jira/ServiceNow)`)
    window.open(`https://jira.example.com/createissue?summary=Drift%20Event%20${id}`, "_blank")
  }

  const handleRetrainModel = (id: string) => {
    alert(`Initiating model retraining for event ${id}... (Simulated action)`)
  }

  const filteredEvents = events.filter((event) => {
    const matchesStatus = filterStatus === "All" || event.status === filterStatus
    const matchesSeverity = filterSeverity === "All" || event.severity === filterSeverity
    const matchesFeature = filterFeature === "All" || event.feature === filterFeature
    const matchesSearchTerm =
      event.metric.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.timestamp.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesStatus && matchesSeverity && matchesFeature && matchesSearchTerm
  })

  const uniqueFeatures = Array.from(new Set(mockDriftEvents.map((event) => event.feature)))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterFeature} onValueChange={setFilterFeature}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Feature" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Features</SelectItem>
            {uniqueFeatures.map((feature) => (
              <SelectItem key={feature} value={feature}>
                {feature}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterSeverity} onValueChange={setFilterSeverity}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Severities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Unresolved">Unresolved</SelectItem>
            <SelectItem value="Acknowledged">Acknowledged</SelectItem>
            <SelectItem value="Resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No drift events found.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.timestamp}</TableCell>
                  <TableCell>{event.metric}</TableCell>
                  <TableCell>{event.feature}</TableCell>
                  <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                  <TableCell>{getStatusBadge(event.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(event.id)}
                        disabled={event.status === "Acknowledged" || event.status === "Resolved"}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" /> Acknowledge
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCreateTicket(event.id)}>
                        <ExternalLink className="h-4 w-4 mr-2" /> Create Ticket
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleRetrainModel(event.id)}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Retrain Model
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
