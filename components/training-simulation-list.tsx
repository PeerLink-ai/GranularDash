"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Play, Eye, Plus } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

interface TrainingSimulation {
  id: string
  name: string
  type: string
  status: string
  last_run?: string
  score?: number
  description?: string
  created_at: string
}

interface TrainingMetrics {
  totalModules: number
  completedSimulations: number
  averageScore: number
}

export function TrainingSimulationList() {
  const { user } = useAuth()
  const [simulations, setSimulations] = useState<TrainingSimulation[]>([])
  const [metrics, setMetrics] = useState<TrainingMetrics>({
    totalModules: 0,
    completedSimulations: 0,
    averageScore: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [selectedSimulation, setSelectedSimulation] = useState<TrainingSimulation | null>(null)

  useEffect(() => {
    if (user) {
      fetchSimulations()
      fetchMetrics()
    }
  }, [user])

  const fetchSimulations = async () => {
    try {
      const response = await fetch("/api/training/simulations")
      if (response.ok) {
        const data = await response.json()
        setSimulations(data.simulations || [])
      } else {
        console.error("Failed to fetch simulations:", response.statusText)
        toast({
          title: "Error",
          description: "Failed to load training simulations",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch simulations:", error)
      toast({
        title: "Error",
        description: "Failed to load training simulations",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    try {
      const response = await fetch("/api/training/metrics")
      if (response.ok) {
        const data = await response.json()
        setMetrics(data)
      }
    } catch (error) {
      console.error("Failed to fetch training metrics:", error)
    }
  }

  const handleViewDetails = (simulation: TrainingSimulation) => {
    setSelectedSimulation(simulation)
    setIsDetailsModalOpen(true)
  }

  const handleStartSimulation = (simulation: TrainingSimulation) => {
    setSelectedSimulation(simulation)
    setIsStartModalOpen(true)
  }

  const confirmStartSimulation = async () => {
    if (!selectedSimulation) return

    try {
      const response = await fetch(`/api/training/simulations/${selectedSimulation.id}/start`, {
        method: "POST",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Started simulation: ${selectedSimulation.name}`,
        })
        fetchSimulations() // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to start simulation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to start simulation:", error)
      toast({
        title: "Error",
        description: "Failed to start simulation",
        variant: "destructive",
      })
    }

    setIsStartModalOpen(false)
    setSelectedSimulation(null)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "in_progress":
        return "secondary"
      case "scheduled":
        return "outline"
      case "failed":
        return "destructive"
      default:
        return "outline"
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Training Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalModules}</div>
            <p className="text-xs text-muted-foreground">Available for agents & staff</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Simulations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedSimulations}</div>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Across all completed trainings</p>
          </CardContent>
        </Card>
      </div>

      {/* Training Simulations Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Training & Simulations</CardTitle>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Simulation
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
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
                {simulations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No training simulations found. Create your first simulation to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  simulations.map((simulation) => (
                    <TableRow key={simulation.id}>
                      <TableCell className="font-medium">{simulation.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{simulation.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(simulation.status)}>{simulation.status}</Badge>
                      </TableCell>
                      <TableCell>{simulation.last_run ? new Date(simulation.last_run).toLocaleDateString() : "N/A"}</TableCell>
                      <TableCell>{simulation.score ? `${simulation.score}%` : "N/A"}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleViewDetails(simulation)}>
                          <Eye className="h-4 w-4 mr-2" /> View Details
                        </Button>
                        {simulation.status !== "in_progress" && (
                          <Button variant="default" size="sm" onClick={() => handleStartSimulation(simulation)}>
                            <Play className="h-4 w-4 mr-2" /> Start Simulation
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
              <span>{selectedSimulation?.last_run ? new Date(selectedSimulation.last_run).toLocaleDateString() : "N/A"}</span>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <span className="font-medium">Score:</span>
              <span>{selectedSimulation?.score ? `${selectedSimulation.score}%` : "N/A"}</span>
            </div>
            {selectedSimulation?.description && (
              <>
                <div className="col-span-2">
                  <span className="font-medium">Description:</span>
                  <p className="text-muted-foreground mt-1">{selectedSimulation.description}</p>
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
    </div>
  )
}
