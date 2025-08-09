"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  Bot,
  RefreshCw,
  Sparkles,
  Check,
  AlertTriangle,
  FileText,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

type Severity = "low" | "medium" | "high" | "critical"
type Status = "active" | "inactive" | "draft"

interface Policy {
  id: string
  name: string
  description: string
  type: string
  status: Status | string
  severity: Severity | string
  applies_to_agents: boolean
  agent_enforcement: "warn" | "block" | "audit" | string
  created_at?: string
  updated_at?: string
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
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isAgentOpen, setIsAgentOpen] = useState(false)
  const [savingAssignments, setSavingAssignments] = useState(false)
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    severity: "medium" as Severity,
    status: "active" as Status,
    applies_to_agents: false,
    agent_enforcement: "warn" as "warn" | "block" | "audit",
  })

  useEffect(() => {
    if (user) {
      fetchPolicies()
      fetchAgents()
    }
  }, [user])

  const fetchPolicies = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/policies", { cache: "no-store" })
      if (!response.ok) throw new Error(await response.text())
      const data = await response.json()
      setPolicies(data.policies || [])
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
      if (!response.ok) return
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error("Failed to fetch agents:", error)
    }
  }

  const fetchAssignments = useCallback(async (policyId: string) => {
    try {
      const res = await fetch(`/api/policies/${policyId}/assignments`)
      if (!res.ok) return []
      const data = await res.json()
      return (data.agent_ids as string[]) || []
    } catch (e) {
      console.error("Failed to fetch assignments:", e)
      return []
    }
  }, [])

  const templates: Array<{
    id: string
    name: string
    type: string
    severity: Severity
    description: string
    agent_enforcement: "warn" | "block" | "audit"
  }> = [
    {
      id: "security-baseline",
      name: "Security baseline",
      type: "security",
      severity: "high",
      description: "Requires MFA, least privilege and blocks risky actions.",
      agent_enforcement: "block",
    },
    {
      id: "pii-access",
      name: "PII access controls",
      type: "data-governance",
      severity: "critical",
      description: "Restricts access to sensitive data; all access is audited.",
      agent_enforcement: "audit",
    },
    {
      id: "rate-limits",
      name: "Operational rate limits",
      type: "operational",
      severity: "medium",
      description: "Rate limits and throttling guardrails for stability.",
      agent_enforcement: "warn",
    },
  ]

  const applyTemplate = (tplId: string) => {
    const t = templates.find((x) => x.id === tplId)
    if (!t) return
    setFormData((prev) => ({
      ...prev,
      name: t.name,
      type: t.type,
      severity: t.severity,
      description: t.description,
      applies_to_agents: true,
      agent_enforcement: t.agent_enforcement,
    }))
  }

  const detailsValid = useMemo(() => formData.name.trim() && formData.type.trim(), [formData.name, formData.type])

  const filteredPolicies = policies.filter(
    (policy) =>
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      policy.type.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "secondary"
      case "medium":
        return "default"
      case "low":
        return "outline"
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "",
      severity: "medium",
      status: "active",
      applies_to_agents: false,
      agent_enforcement: "warn",
    })
    setSelectedAgents([])
  }

  const handleCreatePolicy = async () => {
    if (!detailsValid) {
      toast({ title: "Missing information", description: "Name and type are required.", variant: "destructive" })
      return
    }
    try {
      const response = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agent_ids: formData.applies_to_agents ? selectedAgents : [],
        }),
      })

      if (response.ok) {
        toast({ title: "Policy created", description: "Your policy was created successfully." })
        setIsCreateOpen(false)
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
      toast({ title: "Error", description: "Failed to create policy", variant: "destructive" })
    }
  }

  const openEditModal = async (policy: Policy) => {
    setSelectedPolicy(policy)
    setFormData({
      name: policy.name,
      description: policy.description,
      type: policy.type,
      severity: (policy.severity as Severity) || "medium",
      status: (policy.status as Status) || "active",
      applies_to_agents: policy.applies_to_agents,
      agent_enforcement: (policy.agent_enforcement as "warn" | "block" | "audit") || "warn",
    })
    if (policy.applies_to_agents) {
      const ids = await fetchAssignments(policy.id)
      setSelectedAgents(ids)
    } else {
      setSelectedAgents([])
    }
    setIsEditOpen(true)
  }

  const handleEditPolicy = async () => {
    if (!selectedPolicy) return
    try {
      const response = await fetch(`/api/policies/${selectedPolicy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          agent_ids: formData.applies_to_agents ? selectedAgents : [],
        }),
      })

      if (response.ok) {
        toast({ title: "Policy updated", description: "Your policy changes were saved." })
        setIsEditOpen(false)
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
      toast({ title: "Error", description: "Failed to update policy", variant: "destructive" })
    }
  }

  const handleDeletePolicy = async (policyId: string) => {
    if (!confirm("Are you sure you want to delete this policy?")) return
    try {
      const response = await fetch(`/api/policies/${policyId}`, { method: "DELETE" })
      if (response.ok) {
        toast({ title: "Policy deleted", description: "The policy has been removed." })
        fetchPolicies()
      } else {
        const error = await response.json()
        toast({ title: "Error", description: error.error || "Failed to delete policy", variant: "destructive" })
      }
    } catch (error) {
      console.error("Failed to delete policy:", error)
      toast({ title: "Error", description: "Failed to delete policy", variant: "destructive" })
    }
  }

  const openAgentModal = async (policy: Policy) => {
    setSelectedPolicy(policy)
    const ids = await fetchAssignments(policy.id)
    setSelectedAgents(ids)
    setIsAgentOpen(true)
  }

  const saveAssignments = async () => {
    if (!selectedPolicy) return
    try {
      setSavingAssignments(true)
      const res = await fetch(`/api/policies/${selectedPolicy.id}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_ids: selectedAgents }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || "Failed to save assignments")
      }
      toast({ title: "Assignments saved", description: "Agent assignments updated." })
      setIsAgentOpen(false)
    } catch (e: any) {
      console.error(e)
      toast({ title: "Error", description: e.message || "Failed to save assignments", variant: "destructive" })
    } finally {
      setSavingAssignments(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  function CreateEditContent({
    mode,
    onSubmit,
  }: {
    mode: "create" | "edit"
    onSubmit: () => void
  }) {
    const [tab, setTab] = useState<"details" | "applicability" | "review">("details")
    const valid = detailsValid && (formData.applies_to_agents ? selectedAgents.length >= 0 : true)

    return (
      <div className="grid md:grid-cols-[1fr_320px] gap-6">
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="applicability">Applicability</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Start fast with a template</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className="text-left rounded-md border bg-background p-3 hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="font-medium flex items-center gap-2">
                      {t.name}{" "}
                      <Badge variant={getSeverityColor(t.severity)} className="capitalize">
                        {t.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{t.description}</div>
                  </button>
                ))}
              </div>

              <Separator />

              <div className="grid gap-2">
                <Label htmlFor="name">Policy name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sensitive Data Access"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
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
                    onValueChange={(value) => setFormData({ ...formData, severity: value as Severity })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value as Status })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe what this policy enforces."
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setTab("applicability")} disabled={!detailsValid}>
                  Continue
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="applicability" className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Decide where and how this applies</span>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="applies_to_agents"
                  checked={formData.applies_to_agents}
                  onCheckedChange={(checked) => {
                    const applies = !!checked
                    setFormData({ ...formData, applies_to_agents: applies })
                    if (!applies) setSelectedAgents([])
                  }}
                />
                <Label htmlFor="applies_to_agents">Apply to Connected Agents</Label>
              </div>

              {formData.applies_to_agents && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="agent_enforcement">Agent enforcement</Label>
                    <Select
                      value={formData.agent_enforcement}
                      onValueChange={(value) =>
                        setFormData({ ...formData, agent_enforcement: value as "warn" | "block" | "audit" })
                      }
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
                    <p className="text-xs text-muted-foreground">
                      Choose how strictly this policy is enforced for agent actions.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label>Target agents</Label>
                    {agents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No connected agents found.</p>
                    ) : (
                      <ScrollArea className="max-h-48 rounded border">
                        <div className="p-3 space-y-2">
                          {agents.map((agent) => (
                            <div key={agent.id} className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <Checkbox
                                  id={`agent-${agent.id}`}
                                  checked={selectedAgents.includes(agent.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) setSelectedAgents((prev) => [...prev, agent.id])
                                    else setSelectedAgents((prev) => prev.filter((id) => id !== agent.id))
                                  }}
                                />
                                <Label htmlFor={`agent-${agent.id}`} className="flex items-center gap-2 min-w-0">
                                  <Bot className="h-4 w-4" />
                                  <span className="truncate">{agent.name}</span>
                                </Label>
                              </div>
                              <Badge variant={agent.status === "active" ? "default" : "secondary"}>
                                {agent.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    )}
                    <p className="text-xs text-muted-foreground">Select which agents this policy should apply to.</p>
                  </div>
                </>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setTab("details")}>
                  Back
                </Button>
                <Button onClick={() => setTab("review")} disabled={!detailsValid}>
                  Review
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="review" className="mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Confirm details before saving</span>
              </div>

              <div className="rounded-md border bg-card">
                <div className="p-4 grid gap-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{formData.name || "Untitled policy"}</div>
                    <Badge variant={getStatusColor(formData.status)} className="capitalize">
                      {formData.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">{formData.description || "No description"}</div>
                </div>
                <Separator />
                <div className="p-4 grid sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Type</div>
                    <div className="capitalize">{formData.type || "—"}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Severity</div>
                    <Badge variant={getSeverityColor(formData.severity)} className="capitalize">
                      {formData.severity}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Agent enforcement</div>
                    <div className="capitalize">{formData.applies_to_agents ? formData.agent_enforcement : "N/A"}</div>
                  </div>
                </div>
                {formData.applies_to_agents && (
                  <>
                    <Separator />
                    <div className="p-4">
                      <div className="text-sm text-muted-foreground mb-2">Agents</div>
                      {selectedAgents.length === 0 ? (
                        <div className="text-sm">No agents selected.</div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {selectedAgents.map((id) => {
                            const a = agents.find((x) => x.id === id)
                            return (
                              <Badge key={id} variant="outline">
                                {a?.name || id}
                              </Badge>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setTab("applicability")}>
                  Back
                </Button>
                <Button onClick={onSubmit} disabled={!valid}>
                  {mode === "create" ? "Create policy" : "Save changes"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview sidebar */}
        <div className="hidden md:block">
          <div className="sticky top-4 rounded-lg border bg-card">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-medium">Policy preview</div>
              {detailsValid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              )}
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium truncate max-w-[60%]" title={formData.name}>
                  {formData.name || "Untitled"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="capitalize">{formData.type || "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Severity</span>
                <Badge variant={getSeverityColor(formData.severity)} className="capitalize">
                  {formData.severity}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={getStatusColor(formData.status)} className="capitalize">
                  {formData.status}
                </Badge>
              </div>
              <Separator />
              <div>
                <div className="text-muted-foreground mb-1">Description</div>
                <div className="text-sm">{formData.description || "—"}</div>
              </div>
              <Separator />
              <div className="grid gap-2">
                <div className="text-muted-foreground">Applies to agents</div>
                <div className="capitalize">
                  {formData.applies_to_agents ? (
                    <div className="space-y-2">
                      <div>Enforcement: {formData.agent_enforcement}</div>
                      {selectedAgents.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {selectedAgents.slice(0, 6).map((id) => {
                            const a = agents.find((x) => x.id === id)
                            return (
                              <Badge key={id} variant="outline">
                                {a?.name || id}
                              </Badge>
                            )
                          })}
                          {selectedAgents.length > 6 && (
                            <Badge variant="secondary">+{selectedAgents.length - 6} more</Badge>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No agents selected</div>
                      )}
                    </div>
                  ) : (
                    "No"
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <CardTitle className="truncate">Governance Policies</CardTitle>
            <p className="text-sm text-muted-foreground">Manage policies for {user.organization}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchPolicies}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Policy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-5xl">
                <DialogHeader>
                  <DialogTitle>Create New Policy</DialogTitle>
                  <DialogDescription>Define a new governance policy using a fast, guided setup.</DialogDescription>
                </DialogHeader>
                <CreateEditContent mode="create" onSubmit={handleCreatePolicy} />
              </DialogContent>
            </Dialog>
          </div>
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
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
                      <Badge variant="outline" className="capitalize">
                        {policy.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(policy.status)} className="capitalize">
                        {policy.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(policy.severity)} className="capitalize">
                        {policy.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {policy.applies_to_agents ? (
                        <div className="flex items-center space-x-1">
                          <Bot className="h-3 w-3" />
                          <span className="text-xs capitalize">{policy.agent_enforcement}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>{policy.created_at ? new Date(policy.created_at).toLocaleDateString() : "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {policy.applies_to_agents && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAgentModal(policy)}
                            aria-label="Manage agents"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        <Dialog open={isEditOpen && selectedPolicy?.id === policy.id} onOpenChange={setIsEditOpen}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(policy)}
                            aria-label="Edit policy"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DialogContent className="max-w-5xl">
                            <DialogHeader>
                              <DialogTitle>Edit Policy</DialogTitle>
                              <DialogDescription>Update the policy details using the guided flow.</DialogDescription>
                            </DialogHeader>
                            <CreateEditContent mode="edit" onSubmit={handleEditPolicy} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePolicy(policy.id)}
                          aria-label="Delete policy"
                        >
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

        {/* Agent Assignment Modal */}
        <Dialog open={isAgentOpen} onOpenChange={setIsAgentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agent Policy Assignment</DialogTitle>
              <DialogDescription>Manage which agents this policy applies to: {selectedPolicy?.name}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Connected Agents</Label>
                {agents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No connected agents found.</p>
                ) : (
                  <ScrollArea className="max-h-64 rounded border">
                    <div className="p-3 space-y-2">
                      {agents.map((agent) => (
                        <div key={agent.id} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Checkbox
                              id={`assign-agent-${agent.id}`}
                              checked={selectedAgents.includes(agent.id)}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedAgents((prev) => [...prev, agent.id])
                                else setSelectedAgents((prev) => prev.filter((id) => id !== agent.id))
                              }}
                            />
                            <Label htmlFor={`assign-agent-${agent.id}`} className="flex items-center gap-2 min-w-0">
                              <Bot className="h-4 w-4" />
                              <span className="truncate">{agent.name}</span>
                            </Label>
                          </div>
                          <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAgentOpen(false)}>
                Close
              </Button>
              <Button onClick={saveAssignments} disabled={savingAssignments}>
                {savingAssignments ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
