"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, Edit, Trash2, Shield, Bot } from 'lucide-react'
import { toast } from "@/hooks/use-toast"

interface Policy {
  id: string
  name: string
  description: string
  type: string
  status: string
  severity: string
  applies_to_agents: boolean
  agent_enforcement: string
  created_at: string
  updated_at: string
}

interface ConnectedAgent {
  id: string
  name: string
  status: string
}

export function PolicyList() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [agents, setAgents] = useState<ConnectedAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    severity: "medium",
    applies_to_agents: false,
    agent_enforcement: "warn",
  })

  useEffect(() => {
    if (user) {
      fetchPolicies()
      fetchAgents()
    }
  }, [user])

  const fetchPolicies = async () => {
    try {
      const response = await fetch("/api/policies")
      if (response.ok) {
        const data = await response.json()
        setPolicies(data.policies || [])
      } else {
        console.error("Failed to fetch policies:", response.statusText)
        toast({
          title: "Error",
          description: "Failed to load policies",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to fetch policies:", error)
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    }
  }

  const handleCreatePolicy = async () => {
    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          agent_ids: formData.applies_to_agents ? selectedAgents : [],
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Policy created successfully",
        })
        setIsCreateModalOpen(false)
        resetForm()
        fetchPolicies()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create policy",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to create policy:", error)
      toast({
        title: "Error",
        description: "Failed to create policy",
        variant: "destructive",
      })
    }
  }

  const handleEditPolicy = async () => {
    if (!selectedPolicy) return

    try {
      const response = await fetch(`/api/policies/${selectedPolicy.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          agent_ids: formData.applies_to_agents ? selectedAgents : [],
        }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Policy updated successfully",
        })
        setIsEditModalOpen(false)
        setSelectedPolicy(null)
        resetForm()
        fetchPolicies()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update policy",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update policy:", error)
      toast({
        title: "Error",
        description: "Failed to update policy",
        variant: "destructive",
      })
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return

    try {
      const response = await fetch(`/api/policies/${policyId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Policy deleted successfully",
        })
        fetchPolicies()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete policy",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to delete policy:", error)
      toast({
        title: "Error",
        description: "Failed to delete policy",
        variant: "destructive",
      })
    }
  }

  const openEditModal = (policy: Policy) => {
    setSelectedPolicy(policy)
    setFormData({
      name: policy.name,
      description: policy.description,
      type: policy.type,
      severity: policy.severity,
      applies_to_agents: policy.applies_to_agents,
      agent_enforcement: policy.agent_enforcement || "warn",
    })
    setIsEditModalOpen(true)
  }

  const openAgentModal = (policy: Policy) => {
    setSelectedPolicy(policy)
    setIsAgentModalOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      severity: "medium",
      applies_to_agents: false,
      agent_enforcement: "warn",
    })
    setSelectedAgents([])
  }

  const filteredPolicies = policies.filter(
    (policy) =>
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "inactive":
        return "secondary"
      case "draft":
        return "outline"
      default:
        return "default"
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Governance Policies</CardTitle>
            <p className="text-sm text-muted-foreground">Manage policies for {user.organization}</p>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Policy</DialogTitle>
                <DialogDescription>Define a new governance policy for your organization.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Policy Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter policy name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Policy Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select policy type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="data-governance">Data Governance</SelectItem>
                      <SelectItem value="access-control">Access Control</SelectItem>
                      <SelectItem value="operational">Operational</SelectItem>
                      <SelectItem value="ai-ethics">AI Ethics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="applies_to_agents"
                    checked={formData.applies_to_agents}
                    onCheckedChange={(checked) => setFormData({ ...formData, applies_to_agents: !!checked })}
                  />
                  <Label htmlFor="applies_to_agents">Apply to Connected Agents</Label>
                </div>
                {formData.applies_to_agents && (
                  <div className="grid gap-2">
                    <Label htmlFor="agent_enforcement">Agent Enforcement</Label>
                    <Select
                      value={formData.agent_enforcement}
                      onValueChange={(value) => setFormData({ ...formData, agent_enforcement: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select enforcement level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="warn">Warn Only</SelectItem>
                        <SelectItem value="block">Block Action</SelectItem>
                        <SelectItem value="audit">Audit & Log</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter policy description"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreatePolicy}>Create Policy</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

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
                <TableHead>Severity</TableHead>
                <TableHead>Agent Policy</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPolicies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "No policies found matching your search." : "No policies created yet."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(policy.status)}>{policy.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(policy.severity)}>{policy.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      {policy.applies_to_agents ? (
                        <div className="flex items-center space-x-1">
                          <Bot className="h-3 w-3" />
                          <span className="text-xs">{policy.agent_enforcement}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{new Date(policy.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {policy.applies_to_agents && (
                          <Button variant="ghost" size="sm" onClick={() => openAgentModal(policy)}>
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(policy)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeletePolicy(policy.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Policy</DialogTitle>
              <DialogDescription>Update the policy details.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Policy Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter policy name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Policy Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select policy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="data-governance">Data Governance</SelectItem>
                    <SelectItem value="access-control">Access Control</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="ai-ethics">AI Ethics</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit_applies_to_agents"
                  checked={formData.applies_to_agents}
                  onCheckedChange={(checked) => setFormData({ ...formData, applies_to_agents: !!checked })}
                />
                <Label htmlFor="edit_applies_to_agents">Apply to Connected Agents</Label>
              </div>
              {formData.applies_to_agents && (
                <div className="grid gap-2">
                  <Label htmlFor="edit_agent_enforcement">Agent Enforcement</Label>
                  <Select
                    value={formData.agent_enforcement}
                    onValueChange={(value) => setFormData({ ...formData, agent_enforcement: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select enforcement level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="warn">Warn Only</SelectItem>
                      <SelectItem value="block">Block Action</SelectItem>
                      <SelectItem value="audit">Audit & Log</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter policy description"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditPolicy}>Update Policy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Agent Assignment Modal */}
        <Dialog open={isAgentModalOpen} onOpenChange={setIsAgentModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agent Policy Assignment</DialogTitle>
              <DialogDescription>
                Manage which agents this policy applies to: {selectedPolicy?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Connected Agents</Label>
                {agents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No connected agents found.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {agents.map((agent) => (
                      <div key={agent.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`agent-${agent.id}`}
                          checked={selectedAgents.includes(agent.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAgents([...selectedAgents, agent.id])
                            } else {
                              setSelectedAgents(selectedAgents.filter((id) => id !== agent.id))
                            }
                          }}
                        />
                        <Label htmlFor={`agent-${agent.id}`} className="flex items-center space-x-2">
                          <Bot className="h-4 w-4" />
                          <span>{agent.name}</span>
                          <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                            {agent.status}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAgentModalOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
