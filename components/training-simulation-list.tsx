"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Play,
  Eye,
  Plus,
  Users,
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TrainingSimulation {
  id: string
  name: string
  type: string
  status: string
  last_run?: string
  completed_at?: string
  score?: number
  description?: string
  duration_minutes?: number
  participants_count?: number
  pass_threshold?: number
  difficulty_level?: string
  configuration?: any
  results?: any
  created_at: string
  updated_at?: string
}

interface TrainingModule {
  id: string
  name: string
  type: string
  description?: string
  content?: any
  status: string
  created_at: string
}

interface TrainingCategory {
  id: string
  name: string
  description?: string
  color: string
  created_at: string
}

interface TrainingSession {
  id: string
  simulation_id: string
  user_id?: number
  started_at: string
  completed_at?: string
  score?: number
  status: string
  time_spent_minutes?: number
  feedback?: string
  simulation_name: string
  simulation_type: string
}

interface TrainingMetrics {
  totalModules: number
  completedSimulations: number
  averageScore: number
  activeSimulations: number
  totalParticipants: number
}

export function TrainingSimulationList() {
  const { user } = useAuth()
  const [simulations, setSimulations] = useState<TrainingSimulation[]>([])
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [categories, setCategories] = useState<TrainingCategory[]>([])
  const [sessions, setSessions] = useState<TrainingSession[]>([])
  const [metrics, setMetrics] = useState<TrainingMetrics>({
    totalModules: 0,
    completedSimulations: 0,
    averageScore: 0,
    activeSimulations: 0,
    totalParticipants: 0,
  })
  const [loading, setLoading] = useState(true)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [selectedSimulation, setSelectedSimulation] = useState<TrainingSimulation | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")

  const [newSimulation, setNewSimulation] = useState({
    name: "",
    type: "",
    description: "",
    duration_minutes: 60,
    pass_threshold: 80,
    difficulty_level: "intermediate",
  })

  useEffect(() => {
    if (user) {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setLoading(true)
    await Promise.all([fetchSimulations(), fetchModules(), fetchCategories(), fetchSessions(), fetchMetrics()])
    setLoading(false)
  }

  const fetchSimulations = async () => {
    try {
      const response = await fetch("/api/training/simulations")
      if (response.ok) {
        const data = await response.json()
        setSimulations(data.simulations || [])
      } else {
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
    }
  }

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/training/modules")
      if (response.ok) {
        const data = await response.json()
        setModules(data.modules || [])
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/training/categories")
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error)
    }
  }

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/training/sessions")
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || [])
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
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
        fetchSimulations()
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

  const handleCreateSimulation = async () => {
    try {
      const response = await fetch("/api/training/simulations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSimulation),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Training simulation created successfully",
        })
        fetchSimulations()
        setIsCreateModalOpen(false)
        setNewSimulation({
          name: "",
          type: "",
          description: "",
          duration_minutes: 60,
          pass_threshold: 80,
          difficulty_level: "intermediate",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to create simulation",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create simulation:", error)
      toast({
        title: "Error",
        description: "Failed to create simulation",
        variant: "destructive",
      })
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "scheduled":
        return <Calendar className="h-4 w-4 text-orange-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
    }
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800"
      case "intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredSimulations = simulations.filter((sim) => {
    const statusMatch = filterStatus === "all" || sim.status === filterStatus
    const typeMatch = filterType === "all" || sim.type === filterType
    return statusMatch && typeMatch
  })

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
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Modules</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalModules}</div>
            <p className="text-xs text-muted-foreground">Active modules available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completedSimulations}</div>
            <p className="text-xs text-muted-foreground">Last 6 months</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageScore}%</div>
            <p className="text-xs text-muted-foreground">Across all trainings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSimulations}</div>
            <p className="text-xs text-muted-foreground">In progress & scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">Total trained (6mo)</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="simulations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="simulations">Simulations</TabsTrigger>
          <TabsTrigger value="modules">Training Modules</TabsTrigger>
          <TabsTrigger value="sessions">Recent Sessions</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="simulations" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Training Simulations</CardTitle>
                <div className="flex items-center space-x-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="Security Awareness">Security</SelectItem>
                      <SelectItem value="Incident Response">Incident Response</SelectItem>
                      <SelectItem value="AI Ethics & Safety">AI Ethics</SelectItem>
                      <SelectItem value="Compliance & Governance">Compliance</SelectItem>
                      <SelectItem value="Technical Skills">Technical</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setIsCreateModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Simulation
                  </Button>
                </div>
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
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSimulations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No training simulations found. Create your first simulation to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSimulations.map((simulation) => (
                        <TableRow key={simulation.id}>
                          <TableCell className="font-medium">{simulation.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{simulation.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(simulation.status)}
                              <Badge variant={getStatusColor(simulation.status)}>{simulation.status}</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(simulation.difficulty_level || "intermediate")}`}
                            >
                              {simulation.difficulty_level || "intermediate"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {simulation.duration_minutes ? `${simulation.duration_minutes}m` : "N/A"}
                          </TableCell>
                          <TableCell>{simulation.participants_count || 0}</TableCell>
                          <TableCell>{simulation.score ? `${simulation.score}%` : "N/A"}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(simulation)}>
                              <Eye className="h-4 w-4 mr-2" /> Details
                            </Button>
                            {simulation.status !== "in_progress" && (
                              <Button variant="default" size="sm" onClick={() => handleStartSimulation(simulation)}>
                                <Play className="h-4 w-4 mr-2" /> Start
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
        </TabsContent>

        <TabsContent value="modules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                  <Card key={module.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{module.name}</CardTitle>
                        <Badge variant={module.status === "active" ? "default" : "secondary"}>{module.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{module.description}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{module.type}</Badge>
                        {module.content && (
                          <span className="text-xs text-muted-foreground">{module.content.duration || 0}min</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Training Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Simulation</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-medium">{session.simulation_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.simulation_type}</Badge>
                      </TableCell>
                      <TableCell>{new Date(session.started_at).toLocaleDateString()}</TableCell>
                      <TableCell>{session.time_spent_minutes ? `${session.time_spent_minutes}m` : "N/A"}</TableCell>
                      <TableCell>{session.score ? `${session.score}%` : "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(session.status)}>{session.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Training Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                        <CardTitle className="text-base">{category.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{category.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Simulation Details: {selectedSimulation?.name}</DialogTitle>
            <DialogDescription>Comprehensive information about the selected training simulation.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Type:</span>
                  <span>{selectedSimulation?.type}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Status:</span>
                  <div className="flex items-center space-x-2">
                    {selectedSimulation && getStatusIcon(selectedSimulation.status)}
                    <span>{selectedSimulation?.status}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Difficulty:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(selectedSimulation?.difficulty_level || "intermediate")}`}
                  >
                    {selectedSimulation?.difficulty_level || "intermediate"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Duration:</span>
                  <span>
                    {selectedSimulation?.duration_minutes ? `${selectedSimulation.duration_minutes} minutes` : "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Participants:</span>
                  <span>{selectedSimulation?.participants_count || 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Pass Threshold:</span>
                  <span>{selectedSimulation?.pass_threshold || 80}%</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Last Run:</span>
                  <span>
                    {selectedSimulation?.last_run ? new Date(selectedSimulation.last_run).toLocaleDateString() : "N/A"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">Score:</span>
                  <span>{selectedSimulation?.score ? `${selectedSimulation.score}%` : "N/A"}</span>
                </div>
              </div>
            </div>
            {selectedSimulation?.description && (
              <div className="col-span-2">
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground mt-1">{selectedSimulation.description}</p>
              </div>
            )}
            {selectedSimulation?.results && (
              <div className="col-span-2">
                <span className="font-medium">Results Summary:</span>
                <div className="mt-2 p-3 bg-muted rounded-lg">
                  <pre className="text-xs">{JSON.stringify(selectedSimulation.results, null, 2)}</pre>
                </div>
              </div>
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

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Training Simulation</DialogTitle>
            <DialogDescription>Set up a new training simulation for your organization.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Simulation Name</Label>
                <Input
                  id="name"
                  value={newSimulation.name}
                  onChange={(e) => setNewSimulation({ ...newSimulation, name: e.target.value })}
                  placeholder="Enter simulation name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newSimulation.type}
                  onValueChange={(value) => setNewSimulation({ ...newSimulation, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Security Awareness">Security Awareness</SelectItem>
                    <SelectItem value="Incident Response">Incident Response</SelectItem>
                    <SelectItem value="AI Ethics & Safety">AI Ethics & Safety</SelectItem>
                    <SelectItem value="Compliance & Governance">Compliance & Governance</SelectItem>
                    <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newSimulation.description}
                onChange={(e) => setNewSimulation({ ...newSimulation, description: e.target.value })}
                placeholder="Describe the simulation objectives and content"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={newSimulation.duration_minutes}
                  onChange={(e) =>
                    setNewSimulation({ ...newSimulation, duration_minutes: Number.parseInt(e.target.value) || 60 })
                  }
                  min="15"
                  max="480"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="threshold">Pass Threshold (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newSimulation.pass_threshold}
                  onChange={(e) =>
                    setNewSimulation({ ...newSimulation, pass_threshold: Number.parseInt(e.target.value) || 80 })
                  }
                  min="50"
                  max="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select
                  value={newSimulation.difficulty_level}
                  onValueChange={(value) => setNewSimulation({ ...newSimulation, difficulty_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSimulation} disabled={!newSimulation.name || !newSimulation.type}>
              Create Simulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
