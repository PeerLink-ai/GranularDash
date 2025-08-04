"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface AccessRule {
  id: string
  name: string
  resource: string
  role: string
  permission: string
  status: "active" | "inactive"
  description?: string
  created_at: string
  updated_at: string
}

export function AccessRulesTable() {
  const { user } = useAuth()
  const [rules, setRules] = useState<AccessRule[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<AccessRule | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    resource: "",
    role: "",
    permission: "",
    status: "active" as "active" | "inactive",
    description: "",
  })

  useEffect(() => {
    if (user?.organization) {
      fetchRules()
    }
  }, [user])

  const fetchRules = async () => {
    try {
      const response = await fetch(`/api/access-rules?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        // Ensure rules is always an array
        setRules(Array.isArray(data.rules) ? data.rules : [])
      } else {
        console.error("Failed to fetch rules:", response.statusText)
        setRules([])
      }
    } catch (error) {
      console.error("Error fetching access rules:", error)
      setRules([])
      toast({
        title: "Error",
        description: "Failed to load access rules",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRule = async () => {
    try {
      const response = await fetch("/api/access-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Access rule created successfully",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchRules()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create rule")
      }
    } catch (error) {
      console.error("Error creating access rule:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create access rule",
        variant: "destructive",
      })
    }
  }

  const handleUpdateRule = async () => {
    if (!editingRule) return

    try {
      const response = await fetch(`/api/access-rules/${editingRule.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Access rule updated successfully",
        })
        setEditingRule(null)
        resetForm()
        fetchRules()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update rule")
      }
    } catch (error) {
      console.error("Error updating access rule:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update access rule",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this access rule?")) {
      return
    }

    try {
      const response = await fetch(`/api/access-rules/${ruleId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Access rule deleted successfully",
        })
        fetchRules()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete rule")
      }
    } catch (error) {
      console.error("Error deleting access rule:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete access rule",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      resource: "",
      role: "",
      permission: "",
      status: "active",
      description: "",
    })
  }

  const openEditDialog = (rule: AccessRule) => {
    setEditingRule(rule)
    setFormData({
      name: rule.name,
      resource: rule.resource,
      role: rule.role,
      permission: rule.permission,
      status: rule.status,
      description: rule.description || "",
    })
  }

  const filteredRules = Array.isArray(rules)
    ? rules.filter(
        (rule) =>
          rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rule.role.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-muted-foreground">Loading access rules...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Access Rule</DialogTitle>
              <DialogDescription>Define a new access control rule for AI agents and resources.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  placeholder="Rule name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="resource" className="text-right">
                  Resource
                </Label>
                <Input
                  id="resource"
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="col-span-3"
                  placeholder="Resource name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="ai-agent">AI Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="permission" className="text-right">
                  Permission
                </Label>
                <Select
                  value={formData.permission}
                  onValueChange={(value) => setFormData({ ...formData, permission: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select permission" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="execute">Execute</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateRule}>Create Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredRules.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No access rules match your search" : "No access rules found"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first access rule
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>{rule.resource}</TableCell>
                <TableCell>{rule.role}</TableCell>
                <TableCell>{rule.permission}</TableCell>
                <TableCell>
                  <Badge variant={rule.status === "active" ? "default" : "secondary"}>{rule.status}</Badge>
                </TableCell>
                <TableCell>{new Date(rule.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(rule)}>
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

      {editingRule && (
        <Dialog open={!!editingRule} onOpenChange={() => setEditingRule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Access Rule</DialogTitle>
              <DialogDescription>Update the access control rule settings.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-resource" className="text-right">
                  Resource
                </Label>
                <Input
                  id="edit-resource"
                  value={formData.resource}
                  onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-role" className="text-right">
                  Role
                </Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                    <SelectItem value="ai-agent">AI Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-permission" className="text-right">
                  Permission
                </Label>
                <Select
                  value={formData.permission}
                  onValueChange={(value) => setFormData({ ...formData, permission: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="write">Write</SelectItem>
                    <SelectItem value="execute">Execute</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleUpdateRule}>Update Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
