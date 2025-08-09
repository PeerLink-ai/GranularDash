"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Plus, Search, Edit, Trash2, Shield, Users, Database, Settings, Clock } from "lucide-react"
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

function useIsAnalyst() {
  const { user } = useAuth()
  return user?.role === "analyst"
}

export function AccessRulesTable() {
  const isAnalyst = useIsAnalyst()
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
    conditions: { roles: [] as string[], timeWindow: { start: "08:00", end: "18:00", tz: "UTC" } },
    status: "active" as const,
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const filteredRules = useMemo(() => {
    const q = searchTerm.toLowerCase()
    return rules.filter((r) => (r.name + " " + r.resource_type + " " + r.description).toLowerCase().includes(q))
  }, [rules, searchTerm])

  async function fetchRules() {
    try {
      const response = await fetch("/api/access-rules")
      if (response.ok) {
        const data = await response.json()
        setRules(Array.isArray(data.rules) ? data.rules : [])
      } else {
        setRules([])
      }
    } catch {
      setRules([])
      toast.error("Failed to load access rules")
    } finally {
      setLoading(false)
    }
  }

  async function createRule() {
    try {
      const response = await fetch("/api/access-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to create rule")
      toast.success("Access rule created")
      fetchRules()
      setIsCreateModalOpen(false)
      resetForm()
    } catch (e: any) {
      toast.error(e.message || "Failed to create access rule")
    }
  }

  async function updateRule() {
    if (!editingRule) return
    try {
      const response = await fetch(`/api/access-rules/${editingRule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (!response.ok) throw new Error("Failed to update rule")
      toast.success("Access rule updated")
      fetchRules()
      setEditingRule(null)
      resetForm()
    } catch (e: any) {
      toast.error(e.message || "Failed to update access rule")
    }
  }

  async function deleteRule(ruleId: string) {
    if (!confirm("Delete this access rule?")) return
    try {
      const response = await fetch(`/api/access-rules/${ruleId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete rule")
      toast.success("Access rule deleted")
      fetchRules()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete access rule")
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      description: "",
      resource_type: "",
      permissions: [],
      conditions: { roles: [], timeWindow: { start: "08:00", end: "18:00", tz: "UTC" } },
      status: "active",
    })
  }

  function getResourceIcon(resourceType: string) {
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

  function getStatusColor(status: string) {
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
          {!isAnalyst && (
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
                  <DialogDescription>Roles, time windows, and resource-level permissions</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="rule-name">Rule Name</Label>
                      <Input
                        id="rule-name"
                        value={formData.name}
                        onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                        placeholder="Agent Access Control"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Resource Type</Label>
                      <Select
                        value={formData.resource_type}
                        onValueChange={(v) => setFormData((f) => ({ ...f, resource_type: v }))}
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
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe what this rule controls..."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Allowed Roles</Label>
                      <div className="flex flex-wrap gap-2">
                        {["admin", "analyst", "operator", "viewer"].map((role) => {
                          const selected = formData.conditions.roles.includes(role)
                          return (
                            <Button
                              key={role}
                              size="sm"
                              variant={selected ? "default" : "outline"}
                              onClick={() =>
                                setFormData((f) => ({
                                  ...f,
                                  conditions: {
                                    ...f.conditions,
                                    roles: selected
                                      ? f.conditions.roles.filter((r: string) => r !== role)
                                      : [...f.conditions.roles, role],
                                  },
                                }))
                              }
                            >
                              {role}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Time Window (Local TZ)</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={formData.conditions.timeWindow.start}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              conditions: {
                                ...f.conditions,
                                timeWindow: { ...f.conditions.timeWindow, start: e.target.value },
                              },
                            }))
                          }
                          placeholder="08:00"
                        />
                        <Input
                          value={formData.conditions.timeWindow.end}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              conditions: {
                                ...f.conditions,
                                timeWindow: { ...f.conditions.timeWindow, end: e.target.value },
                              },
                            }))
                          }
                          placeholder="18:00"
                        />
                        <Input
                          value={formData.conditions.timeWindow.tz}
                          onChange={(e) =>
                            setFormData((f) => ({
                              ...f,
                              conditions: {
                                ...f.conditions,
                                timeWindow: { ...f.conditions.timeWindow, tz: e.target.value },
                              },
                            }))
                          }
                          placeholder="UTC"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> Restrict access to business hours or maintenance windows.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createRule} disabled={isAnalyst}>
                      Create Rule
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
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
              {!searchTerm && !isAnalyst && (
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
                        {!isAnalyst && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingRule(rule)
                                setFormData({
                                  name: rule.name,
                                  description: rule.description,
                                  resource_type: rule.resource_type,
                                  permissions: rule.permissions,
                                  conditions: rule.conditions || {
                                    roles: [],
                                    timeWindow: { start: "08:00", end: "18:00", tz: "UTC" },
                                  },
                                  status: rule.status,
                                })
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
              <DialogDescription>Update rule settings, roles, and time windows</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input value={formData.name} onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Resource Type</Label>
                  <Select
                    value={formData.resource_type}
                    onValueChange={(v) => setFormData((f) => ({ ...f, resource_type: v }))}
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
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Allowed Roles</Label>
                  <div className="flex flex-wrap gap-2">
                    {["admin", "analyst", "operator", "viewer"].map((role) => {
                      const selected = formData.conditions.roles?.includes(role)
                      return (
                        <Button
                          key={role}
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          onClick={() =>
                            setFormData((f) => ({
                              ...f,
                              conditions: {
                                ...f.conditions,
                                roles: selected
                                  ? f.conditions.roles.filter((r: string) => r !== role)
                                  : [...(f.conditions.roles || []), role],
                              },
                            }))
                          }
                        >
                          {role}
                        </Button>
                      )
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Time Window</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      value={formData.conditions.timeWindow?.start || "08:00"}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          conditions: {
                            ...f.conditions,
                            timeWindow: { ...(f.conditions.timeWindow || {}), start: e.target.value },
                          },
                        }))
                      }
                      placeholder="08:00"
                    />
                    <Input
                      value={formData.conditions.timeWindow?.end || "18:00"}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          conditions: {
                            ...f.conditions,
                            timeWindow: { ...(f.conditions.timeWindow || {}), end: e.target.value },
                          },
                        }))
                      }
                      placeholder="18:00"
                    />
                    <Input
                      value={formData.conditions.timeWindow?.tz || "UTC"}
                      onChange={(e) =>
                        setFormData((f) => ({
                          ...f,
                          conditions: {
                            ...f.conditions,
                            timeWindow: { ...(f.conditions.timeWindow || {}), tz: e.target.value },
                          },
                        }))
                      }
                      placeholder="UTC"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingRule(null)}>
                  Cancel
                </Button>
                <Button onClick={updateRule}>Update Rule</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
