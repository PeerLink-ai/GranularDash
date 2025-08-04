"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Shield, Users, Database, Settings } from "lucide-react"
import { toast } from "sonner"

interface AccessRule {
  id: string
  name: string
  description: string
  resource_type: string
  permissions: string[]
  conditions: Record<string, any>
  status: "active" | "inactive" | "draft"
  created_at: string
  updated_at: string
}

export function AccessRulesTable() {
  const { user } = useAuth()
  const [rules, setRules] = useState<AccessRule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AccessRule | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    resource_type: "",
    permissions: [] as string[],
    conditions: {},
    status: "active" as const,
  })

  useEffect(() => {
    if (user) {
      fetchRules()
    }
  }, [user])

  const fetchRules = async () => {
    try {
      const response = await fetch("/api/access-rules")
      if (response.ok) {
        const data = await response.json()
        setRules(Array.isArray(data.rules) ? data.rules : [])
      } else {
        console.error("Failed to fetch rules:", response.statusText)
        setRules([])
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error)
      setRules([])
      toast.error("Failed to load access rules")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await fetch("/api/access-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Access rule created successfully")
        fetchRules()
        setIsCreateModalOpen(false)
        resetForm()
      } else {
        throw new Error("Failed to create rule")
      }
    } catch (error) {
      toast.error("Failed to create access rule")
    }
  }

  const handleUpdateRule = async () => {
    if (!editingRule) return

    try {
      const response = await fetch(`/api/access-rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success("Access rule updated successfully")
        fetchRules()
        setEditingRule(null)
        resetForm()
      } else {
        throw new Error("Failed to update rule")
      }
    } catch (error) {
      toast.error("Failed to update access rule")
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this access rule?")) return

    try {
      const response = await fetch(`/api/access-rules/${ruleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Access rule deleted successfully")
        fetchRules()
      } else {
        throw new Error("Failed to delete rule")
      }
    } catch (error) {
      toast.error("Failed to delete access rule")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      resource_type: "",
      permissions: [],
      conditions: {},
      status: "active",
    })
  }

  const openEditModal = (rule: AccessRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      description: rule.description,
      resource_type: rule.resource_type,
      permissions: rule.permissions,
      conditions: rule.conditions,
      status: rule.status,
    })
  }

  const filteredRules = rules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.resource_type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "agents":
        return <Shield className="h-4 w-4" />
      case "users":
        return <Users className="h-4 w-4" />
      case "data":
        return <Database className="h-4 w-4" />
      default:
        return <Settings className="h-4 w-4" />
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
        return "secondary"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Access Rules</CardTitle>
            <CardDescription>Manage access control rules for your organization</CardDescription>
          </div>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Access Rule</DialogTitle>
                <DialogDescription>Define a new access control rule for your organization</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input
                      id="rule-name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Agent Access Control"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="resource-type">Resource Type</Label>
                    <Select
                      value={formData.resource_type}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, resource_type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agents">AI Agents</SelectItem>
                        <SelectItem value="users">Users</SelectItem>
                        <SelectItem value="data">Data Sources</SelectItem>
                        <SelectItem value="policies">Policies</SelectItem>
                        <SelectItem value="reports">Reports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this rule controls..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "active" | "inactive" | "draft") =>
                      setFormData((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRule}>Create Rule</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search access rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filteredRules.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Access Rules</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "No rules match your search." : "Create your first access rule to get started."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Rule
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule Name</TableHead>
                  <TableHead>Resource Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rule.name}</div>
                        <div className="text-sm text-muted-foreground">{rule.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getResourceIcon(rule.resource_type)}
                        <span className="capitalize">{rule.resource_type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(rule.status)}>{rule.status}</Badge>
                    </TableCell>
                    <TableCell>{new Date(rule.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Edit Modal */}
        <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Access Rule</DialogTitle>
              <DialogDescription>Update the access control rule settings</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="edit-rule-name">Rule Name</Label>
                  <Input
                    id="edit-rule-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-resource-type">Resource Type</Label>
                  <Select
                    value={formData.resource_type}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, resource_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agents">AI Agents</SelectItem>
                      <SelectItem value="users">Users</SelectItem>
                      <SelectItem value="data">Data Sources</SelectItem>
                      <SelectItem value="policies">Policies</SelectItem>
                      <SelectItem value="reports">Reports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "draft") =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingRule(null)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRule}>Update Rule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
