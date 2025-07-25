"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Play, Eye } from "lucide-react"

const initialSimulations = [
  {
    id: "TS001",
    name: "Phishing Attack Simulation",
    type: "Security",
    status: "Completed",
    lastRun: "2023-07-10",
    score: "85%",
    details: "Simulated a targeted phishing campaign to test employee awareness.",
  },
  {
    id: "TS002",
    name: "Data Breach Response Drill",
    type: "Incident Response",
    status: "Scheduled",
    lastRun: "N/A",
    score: "N/A",
    details: "Tabletop exercise for data breach incident response team.",
  },
  {
    id: "TS003",
    name: "AI Bias Detection Training",
    type: "Ethical AI",
    status: "Completed",
    lastRun: "2023-06-25",
    score: "92%",
    details: "Training module on identifying and mitigating AI model bias.",
  },
  {
    id: "TS004",
    name: "Compliance Policy Review",
    type: "Compliance",
    status: "In Progress",
    lastRun: "2023-07-01",
    score: "N/A",
    details: "Interactive module for reviewing new regulatory compliance policies.",
  },
]

export function TrainingSimulationList() {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [selectedSimulation, setSelectedSimulation] = useState(null)

  const handleViewDetails = (simulation) => {
    setSelectedSimulation(simulation)
    setIsDetailsModalOpen(true)
  }

  const handleStartSimulation = (simulation) => {
    setSelectedSimulation(simulation)
    setIsStartModalOpen(true)
  }

  const confirmStartSimulation = () => {
    alert(`Starting simulation: ${selectedSimulation.name}`)
    // In a real app, this would trigger the simulation process
    setIsStartModalOpen(false)
    setSelectedSimulation(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training & Simulations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialSimulations.map((simulation) => (
              <TableRow key={simulation.id}>
                <TableCell className="font-medium">{simulation.name}</TableCell>
                <TableCell>{simulation.type}</TableCell>
                <TableCell>{simulation.status}</TableCell>
                <TableCell>{simulation.lastRun}</TableCell>
                <TableCell>{simulation.score}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleViewDetails(simulation)}>
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </Button>
                  {simulation.status !== "In Progress" && (
                    <Button variant="default" size="sm" onClick={() => handleStartSimulation(simulation)}>
                      <Play className="h-4 w-4 mr-2" /> Start Simulation
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>

      {/* Simulation Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Simulation Details: {selectedSimulation?.name}</DialogTitle>
            <DialogDescription>Detailed information about the selected training or simulation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Type:</span>
              <span>{selectedSimulation?.type}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Status:</span>
              <span>{selectedSimulation?.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Last Run:</span>
              <span>{selectedSimulation?.lastRun}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Score:</span>
              <span>{selectedSimulation?.score}</span>
            </div>
            {selectedSimulation?.details && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedSimulation.details}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Start Simulation Confirmation Modal */}
      <Dialog open={isStartModalOpen} onOpenChange={setIsStartModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Start Simulation</DialogTitle>
            <DialogDescription>
              Are you sure you want to start the "{selectedSimulation?.name}" simulation?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStartModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmStartSimulation}>Start Now</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
