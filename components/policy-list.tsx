"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Policy {
  id: string
  name: string
  type: string
  description: string
  rules: any
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "inactive" | "draft"
  created_at: string
  updated_at: string
}

interface PolicyListProps {
  searchQuery: string
  onRefresh: () => void
}

export function PolicyList({ searchQuery, onRefresh }: PolicyListProps) {
  const [policies, setPolicies] = useState<Policy[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    description: "",
    rules: "",
    severity: "medium" as const,
    status: "active" as const,
  })
  const { toast } = useToast()

  const fetchPolicies = async () => {
    try {
      const url = searchQuery ? `/api/policies?search=${encodeURIComponent(searchQuery)}` : "/api/policies"

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setPolicies(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch policies:", error)
      toast({
        title: "Error",
        description: "Failed to load policies",
        variant: "destructive",
      })
      setPolicies([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [searchQuery])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingPolicy ? `/api/policies/${editingPolicy.id}` : "/api/policies"
      const method = editingPolicy ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          rules: formData.rules ? JSON.parse(formData.rules) : {},
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: `Policy ${editingPolicy ? "updated" : "created"} successfully`,
      })

      setIsCreateModalOpen(false)
      setEditingPolicy(null)
      setFormData({
        name: "",
        type: "",
        description: "",
        rules: "",
        severity: "medium",
        status: "active",
      })
      fetchPolicies()
      onRefresh()
    } catch (error) {
      console.error("Failed to save policy:", error)
      toast({
        title: "Error",
        description: `Failed to ${editingPolicy ? "update" : "create"} policy`,
        variant: "destructive",
      })
    }
  }

  const handleEdit = (policy: Policy) => {
    setEditingPolicy(policy)
    setFormData({
      name: policy.name,
      type: policy.type,
      description: policy.description,
      rules: JSON.stringify(policy.rules, null, 2),
      severity: policy.severity,
      status: policy.status,
    })
    setIsCreateModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return

    try {
      const response = await fetch(`/api/policies/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast({
        title: "Success",
        description: "Policy deleted successfully",
      })

      fetchPolicies()
      onRefresh()
    } catch (error) {
      console.error("Failed to delete policy:", error)
      toast({
        title: "Error",
        description: "Failed to delete policy",
        variant: "destructive",
      })
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "draft":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      description: "",
      rules: "",
      severity: "medium",
      status: "active",
    })
    setEditingPolicy(null)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Governance Policies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 w-48 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-full bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Governance Policies</CardTitle>
        <Dialog
          open={isCreateModalOpen}
          onOpenChange={(open) => {
            setIsCreateModalOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPolicy ? "Edit Policy" : "Create New Policy"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Policy Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Policy Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="data-privacy">Data Privacy</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="compliance">Compliance</SelectItem>
                      <SelectItem value="access-control">Access Control</SelectItem>
                      <SelectItem value="ai-ethics">AI Ethics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rules">Rules (JSON)</Label>
                <Textarea
                  id="rules"
                  value={formData.rules}
                  onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                  placeholder='{"conditions": [], "actions": []}'
                  className="font-mono text-sm"
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
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
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateModalOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingPolicy ? "Update" : "Create"} Policy</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {policies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No policies found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No policies match your search criteria."
                : "Get started by creating your first governance policy."}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Policy
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => (
              <div key={policy.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{policy.name}</h3>
                      <Badge variant="outline" className={getSeverityColor(policy.severity)}>
                        {policy.severity}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(policy.status)}>
                        {policy.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Type: {policy.type}</span>
                      <span>Created: {new Date(policy.created_at).toLocaleDateString()}</span>
                      {policy.updated_at !== policy.created_at && (
                        <span>Updated: {new Date(policy.updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(policy)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(policy.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
