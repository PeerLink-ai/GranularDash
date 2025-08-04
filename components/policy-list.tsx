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
import { Plus, Edit, Trash2, Search, FileText } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "@/hooks/use-toast"

interface Policy {
  id: string
  name: string
  category: string
  version: string
  description?: string
  status: "active" | "inactive" | "draft"
  created_at: string
  updated_at: string
}

export function PolicyList() {
  const { user } = useAuth()
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    version: "1.0",
    description: "",
    status: "draft" as "active" | "inactive" | "draft",
  })

  useEffect(() => {
    if (user?.organization) {
      fetchPolicies()
    }
  }, [user])

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`/api/policies?organization=${user?.organization}`)
      if (response.ok) {
        const data = await response.json()
        // Ensure policies is always an array
        setPolicies(Array.isArray(data.policies) ? data.policies : [])
      } else {
        console.error("Failed to fetch policies:", response.statusText)
        setPolicies([])
      }
    } catch (error) {
      console.error("Error fetching policies:", error)
      setPolicies([])
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePolicy = async () => {
    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Policy created successfully",
        })
        setIsCreateDialogOpen(false)
        resetForm()
        fetchPolicies()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create policy")
      }
    } catch (error) {
      console.error("Error creating policy:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create policy",
        variant: "destructive",
      })
    }
  }

  const handleUpdatePolicy = async () => {
    if (!editingPolicy) return

    try {
      const response = await fetch(`/api/policies/${editingPolicy.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Policy updated successfully",
        })
        setEditingPolicy(null)
        resetForm()
        fetchPolicies()
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update policy")
      }
    } catch (error) {
      console.error("Error updating policy:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update policy",
        variant: "destructive",
      })
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) {
      return
    }

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
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete policy")
      }
    } catch (error) {
      console.error("Error deleting policy:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete policy",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      category: "",
      version: "1.0",
      description: "",
      status: "draft",
    })
  }

  const openEditDialog = (policy: Policy) => {
    setEditingPolicy(policy)
    setFormData({
      name: policy.name,
      category: policy.category,
      version: policy.version,
      description: policy.description || "",
      status: policy.status,
    })
  }

  const filteredPolicies = Array.isArray(policies)
    ? policies.filter(
        (policy) =>
          policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          policy.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-pulse text-muted-foreground">Loading policies...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search policies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Policy</DialogTitle>
              <DialogDescription>Create a new governance policy for your AI agents.</DialogDescription>
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
                  placeholder="Policy name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Ethics">Ethics</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Data Privacy">Data Privacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="version" className="text-right">
                  Version
                </Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="col-span-3"
                  placeholder="1.0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "draft") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
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
                  placeholder="Policy description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePolicy}>Create Policy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {filteredPolicies.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {searchTerm ? "No policies match your search" : "No policies found"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first policy
            </Button>
          )}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPolicies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell className="font-medium">{policy.name}</TableCell>
                <TableCell>{policy.category}</TableCell>
                <TableCell>{policy.version}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      policy.status === "active" ? "default" : policy.status === "draft" ? "secondary" : "outline"
                    }
                  >
                    {policy.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(policy.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePolicy(policy.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {editingPolicy && (
        <Dialog open={!!editingPolicy} onOpenChange={() => setEditingPolicy(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Policy</DialogTitle>
              <DialogDescription>Update the policy settings and content.</DialogDescription>
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
                <Label htmlFor="edit-category" className="text-right">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Compliance">Compliance</SelectItem>
                    <SelectItem value="Ethics">Ethics</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Data Privacy">Data Privacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-version" className="text-right">
                  Version
                </Label>
                <Input
                  id="edit-version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-status" className="text-right">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: "active" | "inactive" | "draft") =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
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
              <Button onClick={handleUpdatePolicy}>Update Policy</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
