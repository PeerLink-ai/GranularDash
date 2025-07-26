"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from "lucide-react"

type DriftEvent = {
  id: string
  timestamp: string
  metric: string
  feature: string
  severity: "Critical" | "High" | "Medium" | "Low"
  status: "Unresolved" | "Acknowledged" | "Resolved"
  value: number
  threshold: number
}

const mockDriftEvents: DriftEvent[] = [
  {
    id: "1",
    timestamp: "2024-07-20 10:30:00",
    metric: "Input Feature Distribution",
    feature: "Customer Age",
    severity: "Critical",
    status: "Unresolved",
    value: 0.65,
    threshold: 0.55,
  },
  {
    id: "2",
    timestamp: "2024-07-19 14:15:00",
    metric: "Target Accuracy",
    feature: "Model Performance",
    severity: "High",
    status: "Unresolved",
    value: 0.82,
    threshold: 0.87,
  },
  {
    id: "3",
    timestamp: "2024-07-18 09:00:00",
    metric: "Input Feature Distribution",
    feature: "Income Level",
    severity: "Medium",
    status: "Acknowledged",
    value: 0.78,
    threshold: 0.75,
  },
  {
    id: "4",
    timestamp: "2024-07-17 11:45:00",
    metric: "Target Accuracy",
    feature: "Model Performance",
    severity: "Low",
    status: "Resolved",
    value: 0.89,
    threshold: 0.87,
  },
  {
    id: "5",
    timestamp: "2024-07-16 16:00:00",
    metric: "Input Feature Distribution",
    feature: "Geographic Location",
    severity: "High",
    status: "Unresolved",
    value: 0.6,
    threshold: 0.55,
  },
]

export function DriftEventsTable() {
  const [events, setEvents] = useState<DriftEvent[]>(mockDriftEvents)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSeverity, setFilterSeverity] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterFeature, setFilterFeature] = useState<string>("all")

  const handleAcknowledge = (id: string) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) => (event.id === id ? { ...event, status: "Acknowledged" } : event)),
    )
    alert(`Event ${id} acknowledged!`)
  }

  const handleCreateTicket = (id: string) => {
    // In a real app, this would link to Jira/ServiceNow
    alert(`Creating ticket for event ${id}... (Simulated)`)
    console.log(`Simulating ticket creation for event ${id}`)
  }

  const handleRetrainModel = (id: string) => {
    // In a real app, this would trigger a model retraining pipeline
    alert(`Initiating model retraining for event ${id}... (Simulated)`)
    console.log(`Simulating model retraining for event ${id}`)
  }

  const getSeverityBadgeVariant = (severity: DriftEvent["severity"]) => {
    switch (severity) {
      case "Critical":
        return "destructive"
      case "High":
        return "default" // You might want a custom color for High
      case "Medium":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "default"
    }
  }

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      searchTerm === "" ||
      event.metric.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.feature.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.severity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.status.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity = filterSeverity === "all" || event.severity === filterSeverity
    const matchesStatus = filterStatus === "all" || event.status === filterStatus
    const matchesFeature = filterFeature === "all" || event.feature === filterFeature

    return matchesSearch && matchesSeverity && matchesStatus && matchesFeature
  })

  const uniqueFeatures = Array.from(new Set(mockDriftEvents.map((event) => event.feature)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Drift Events</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 mb-4">
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
              <SelectItem value="all">All Features</SelectItem>
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
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Unresolved">Unresolved</SelectItem>
              <SelectItem value="Acknowledged">Acknowledged</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Metric</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Threshold</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.timestamp}</TableCell>
                  <TableCell>{event.metric}</TableCell>
                  <TableCell>{event.feature}</TableCell>
                  <TableCell>
                    <Badge variant={getSeverityBadgeVariant(event.severity)}>{event.severity}</Badge>
                  </TableCell>
                  <TableCell>{event.status}</TableCell>
                  <TableCell>{event.value.toFixed(2)}</TableCell>
                  <TableCell>{event.threshold.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleAcknowledge(event.id)}
                          disabled={event.status !== "Unresolved"}
                        >
                          Acknowledge
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCreateTicket(event.id)}>Create Ticket</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRetrainModel(event.id)}>Retrain Model</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  No drift events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
