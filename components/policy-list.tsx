"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { Plus, Filter, Users, Shield, Settings, Check, GitBranch, Globe, Bot } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Policy = {
  id: string
  name: string
  description?: string
  type: string
  status: "active" | "inactive" | "draft"
  severity: "low" | "medium" | "high" | "critical"
  applies_to_agents?: boolean
  agent_enforcement?: "warn" | "block" | "audit"
  created_at?: string | number
  updated_at?: string | number
}

type Agent = { id: string | number; name: string; type?: string }
type Project = { id: string; name: string; repo_url?: string }

const TEMPLATES: Array<{ id: string; name: string; description: string; type: string; severity: Policy["severity"] }> =
  [
    {
      id: "soc2-logging",
      name: "SOC 2 Logging Baseline",
      description: "Immutable ledger logging with retention and alerting.",
      type: "operational",
      severity: "medium",
    },
    {
      id: "gdpr-privacy",
      name: "GDPR Privacy Protection",
      description: "PII access controls and auditability.",
      type: "compliance",
      severity: "high",
    },
    {
      id: "agent-safety",
      name: "Agent Safety Guardrails",
      description: "Block risky tools and require approvals.",
      type: "security",
      severity: "high",
    },
  ]

export function PolicyList() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = React.useState<Policy[]>([])
  const [query, setQuery] = React.useState("")
  const [createOpen, setCreateOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState<Policy | null>(null)
  const [assignOpen, setAssignOpen] = React.useState<Policy | null>(null)
  const [agents, setAgents] = React.useState<Agent[]>([])
  const [projects, setProjects] = React.useState<Project[]>([])

  React.useEffect(() => {
    load()
    loadAgents()
    loadProjects()
  }, [])

  async function load() {
    try {
      const r = await fetch("/api/policies", { cache: "no-store" })
      const data = await r.json()
      setItems(data.policies ?? data.items ?? [])
    } catch {
      setItems([])
    }
  }
  async function loadAgents() {
    try {
      const r = await fetch("/api/agents", { cache: "no-store" })
      const data = await r.json()
      setAgents((data.agents ?? []).map((a: any) => ({ id: a.id, name: a.name })))
    } catch {
      setAgents([])
    }
  }
  async function loadProjects() {
    try {
      const r = await fetch("/api/projects", { cache: "no-store" })
      const data = await r.json()
      setProjects(
        (data.projects ?? data.items ?? []).map((p: any) => ({ id: String(p.id), name: p.name, repo_url: p.repo_url })),
      )
    } catch {
      setProjects([])
    }
  }

  const filtered = items.filter((p) =>
    (p.name + " " + (p.description ?? "") + " " + p.type).toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Policies</h2>
          <p className="text-muted-foreground">
            Define guardrails and compliance requirements for agents and projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policies..."
              className="pl-8 w-64"
            />
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Policy Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No policies yet. Create your first policy with the guided modal.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.description}</div>
                    </TableCell>
                    <TableCell className="capitalize">{p.type}</TableCell>
                    <TableCell>
                      <Badge variant={p.severity === "critical" ? "destructive" : "outline"} className="capitalize">
                        {p.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.status === "active" ? "default" : p.status === "draft" ? "outline" : "secondary"}
                        className="capitalize"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setAssignOpen(p)}>
                          <Users className="h-4 w-4 mr-1" /> Assign
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditOpen(p)}>
                          <Settings className="h-4 w-4 mr-1" /> Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreatePolicyModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={load}
        agents={agents}
        projects={projects}
      />

      {editOpen && <EditPolicyModal policy={editOpen} onOpenChange={(o) => !o && setEditOpen(null)} onUpdated={load} />}

      {assignOpen && (
        <AssignAgentsModal policy={assignOpen} agents={agents} onOpenChange={(o) => !o && setAssignOpen(null)} />
      )}
    </div>
  )
}

function CreatePolicyModal({
  open,
  onOpenChange,
  onCreated,
  agents,
  projects,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
  agents: Agent[]
  projects: Project[]
}) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = React.useState("templates")
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    type: "security",
    severity: "medium" as Policy["severity"],
    applies_to_agents: true,
    agent_enforcement: "warn" as "warn" | "block" | "audit",
    agent_ids: [] as Array<string | number>,
    project_id: "" as string,
    repo_url: "" as string,
  })
  const [creating, setCreating] = React.useState(false)

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setForm((f) => ({
      ...f,
      name: t.name,
      description: t.description,
      type: t.type,
      severity: t.severity,
    }))
    setActiveTab("details")
  }

  async function createPolicy() {
    setCreating(true)
    try {
      const payload = {
        ...form,
        project_id: form.project_id || undefined,
        repo_url: form.repo_url || undefined,
        agent_ids: form.agent_ids,
      }
      const res = await fetch("/api/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to create policy")
      toast({ title: "Policy created", description: data.policy?.name || "Success" })
      onOpenChange(false)
      onCreated()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create policy", variant: "destructive" })
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Policy</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="applicability">Applicability</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-4">
            <div className="grid gap-3 md:grid-cols-3">
              {TEMPLATES.map((t) => (
                <Card
                  role="button"
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  className="hover:shadow-sm transition-shadow"
                >
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" /> {t.name}
                    </CardTitle>
                    <CardContent className="p-0 pt-2 text-sm text-muted-foreground">{t.description}</CardContent>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="details" className="mt-4 space-y-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Policy name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="ai-ethics">AI Ethics</SelectItem>
                    <SelectItem value="data-governance">Data Governance</SelectItem>
                    <SelectItem value="access-control">Access Control</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select
                  value={form.severity}
                  onValueChange={(v: Policy["severity"]) => setForm((f) => ({ ...f, severity: v }))}
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
              <div className="grid gap-2">
                <Label>Agent enforcement</Label>
                <Select
                  value={form.agent_enforcement}
                  onValueChange={(v: "warn" | "block" | "audit") => setForm((f) => ({ ...f, agent_enforcement: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warn">Warn</SelectItem>
                    <SelectItem value="block">Block</SelectItem>
                    <SelectItem value="audit">Audit-only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>
                  <GitBranch className="inline h-4 w-4 mr-1" />
                  Link to Project (optional)
                </Label>
                <Select value={form.project_id} onValueChange={(v) => setForm((f) => ({ ...f, project_id: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>
                  <Globe className="inline h-4 w-4 mr-1" />
                  Repo URL (optional)
                </Label>
                <Input
                  placeholder="https://github.com/org/repo"
                  value={form.repo_url}
                  onChange={(e) => setForm((f) => ({ ...f, repo_url: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="applicability" className="mt-4 space-y-4">
            <div className="grid gap-2">
              <Label>Assign to Agents</Label>
              <div className="grid gap-2 md:grid-cols-2">
                {agents.map((a) => {
                  const s = form.agent_ids.includes(a.id)
                  return (
                    <Button
                      key={String(a.id)}
                      variant={s ? "default" : "outline"}
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          agent_ids: s ? f.agent_ids.filter((x) => x !== a.id) : [...f.agent_ids, a.id],
                        }))
                      }
                      className="justify-start"
                    >
                      <Bot className="h-4 w-4 mr-2" />
                      <span className="truncate">{a.name}</span>
                      {s && <Check className="h-4 w-4 ml-auto" />}
                    </Button>
                  )
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={createPolicy} disabled={creating || !form.name}>
            {creating ? "Creating..." : "Create Policy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditPolicyModal({
  policy,
  onOpenChange,
  onUpdated,
}: {
  policy: Policy
  onOpenChange: (v: boolean) => void
  onUpdated: () => void
}) {
  const { toast } = useToast()
  const [form, setForm] = React.useState({
    name: policy.name,
    description: policy.description ?? "",
    type: policy.type,
    severity: policy.severity,
    status: policy.status,
  })
  const [saving, setSaving] = React.useState(false)

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/policies/${policy.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast({ title: "Policy updated" })
      onOpenChange(false)
      onUpdated()
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Policy</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v: Policy["status"]) => setForm((f) => ({ ...f, status: v }))}>
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
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AssignAgentsModal({
  policy,
  agents,
  onOpenChange,
}: {
  policy: Policy
  agents: Agent[]
  onOpenChange: (v: boolean) => void
}) {
  const { toast } = useToast()
  const [selected, setSelected] = React.useState<Array<string | number>>([])
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch(`/api/policies/${policy.id}/assignments`)
      .then((r) => r.json())
      .then((data) => setSelected(data.agent_ids ?? []))
      .catch(() => setSelected([]))
      .finally(() => setLoading(false))
  }, [policy.id])

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/policies/${policy.id}/assignments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_ids: selected }),
      })
      if (!res.ok) throw new Error("Failed to update assignments")
      toast({ title: "Assignments updated" })
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to update assignments", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Assign Agents</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="p-6 text-muted-foreground">Loading agents...</div>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-2">
              {agents.map((a) => {
                const s = selected.includes(a.id)
                return (
                  <Button
                    key={String(a.id)}
                    variant={s ? "default" : "outline"}
                    onClick={() =>
                      setSelected((arr) => (arr.includes(a.id) ? arr.filter((x) => x !== a.id) : [...arr, a.id]))
                    }
                    className="justify-start"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span className="truncate">{a.name}</span>
                    {s && <Check className="h-4 w-4 ml-auto" />}
                  </Button>
                )
              })}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
