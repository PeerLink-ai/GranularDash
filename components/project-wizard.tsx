"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { ExternalLink, Github, Hammer, FolderKanban, CheckCircle2, Shield, GitBranch, ScanSearch } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type Props = {
  open?: boolean
  onOpenChange?: (v: boolean) => void
  onCreated?: (project: any) => void
}

type Step = "choose" | "connect" | "detect" | "policies" | "review" | "new"

type DetectedAgent = {
  name: string
  path: string
  id?: string
  provider?: string
  model?: string
  endpoint?: string
  metadata?: Record<string, any>
  selected?: boolean
}

type Policy = { id: string; name: string; description?: string; category?: string; severity?: string }

export function ProjectWizard({ open = false, onOpenChange = () => {}, onCreated }: Props) {
  const [step, setStep] = React.useState<Step>("choose")

  // Shared
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")

  // New native
  const [template, setTemplate] = React.useState<"governance" | "analytics" | "empty">("governance")

  // Git connect
  const [repoUrl, setRepoUrl] = React.useState("")
  const [branch, setBranch] = React.useState("main")
  const [repoValid, setRepoValid] = React.useState<null | {
    owner: string
    repo: string
    branch: string
    default_branch?: string
  }>(null)
  const [repoChecking, setRepoChecking] = React.useState(false)

  // Detection
  const [agents, setAgents] = React.useState<DetectedAgent[]>([])
  const [scanning, setScanning] = React.useState(false)

  // Policies
  const [policies, setPolicies] = React.useState<Policy[]>([])
  const [selectedPolicies, setSelectedPolicies] = React.useState<Record<string, boolean>>({})

  // Review
  const [userId, setUserId] = React.useState("") // required for agent insert

  const { toast } = useToast()

  React.useEffect(() => {
    if (!open) {
      resetAll()
    }
  }, [open])

  function resetAll() {
    setStep("choose")
    setName("")
    setDescription("")
    setTemplate("governance")
    setRepoUrl("")
    setBranch("main")
    setRepoValid(null)
    setAgents([])
    setPolicies([])
    setSelectedPolicies({})
    setScanning(false)
    setRepoChecking(false)
    setUserId("")
  }

  async function validateGitHub() {
    try {
      setRepoChecking(true)
      setRepoValid(null)
      const parsed = parseGitHubUrl(repoUrl)
      if (!parsed) throw new Error("Please enter a valid GitHub repository URL.")
      // Validate reachability
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
      if (!res.ok) throw new Error(`Repository not accessible (${res.status}).`)
      const data = await res.json()
      setRepoValid({ owner: parsed.owner, repo: parsed.repo, branch, default_branch: data.default_branch })
      if (!name) setName(data.name)
      if (!description && data.description) setDescription(data.description)
      toast({ title: "Repository verified", description: `${parsed.owner}/${parsed.repo}` })
    } catch (e: any) {
      toast({ title: "Validation failed", description: e.message, variant: "destructive" })
      setRepoValid(null)
    } finally {
      setRepoChecking(false)
    }
  }

  async function scanForAgents() {
    try {
      if (!repoValid) {
        toast({ title: "Validate repository first", variant: "destructive" })
        return
      }
      setScanning(true)
      const res = await fetch("/api/projects/connect-git", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl, branch }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "Scan failed")
      const detected = (payload?.detectedAgents ?? []) as DetectedAgent[]
      // Default select all
      setAgents(
        detected.map((a) => ({
          ...a,
          selected: true,
          provider: a.provider || "openai",
          model: a.model || "gpt-4o",
        })),
      )
      setStep("detect")
      toast({ title: "Scan complete", description: `Found ${detected.length} potential agent(s)` })
    } catch (e: any) {
      toast({ title: "Could not scan repository", description: e.message, variant: "destructive" })
    } finally {
      setScanning(false)
    }
  }

  async function loadPolicies() {
    try {
      const res = await fetch("/api/policies/list", { cache: "no-store" })
      const data = await res.json()
      const list: Policy[] = Array.isArray(data?.policies) ? data.policies : []
      setPolicies(list)
      setSelectedPolicies((prev) => {
        const next = { ...prev }
        for (const p of list) {
          if (!(p.id in next)) next[p.id] = false
        }
        return next
      })
      setStep("policies")
    } catch (e: any) {
      toast({ title: "Could not load policies", description: e.message, variant: "destructive" })
    }
  }

  async function createNative() {
    try {
      if (!name.trim()) {
        toast({ title: "Name required", description: "Please provide a project name.", variant: "destructive" })
        return
      }
      const body = {
        id: crypto.randomUUID(),
        name: name.trim(),
        description: description.trim() || undefined,
        type: "native" as const,
        metadata: { template },
        pinned: true,
      }
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || "Failed to create project")
      toast({ title: "Project created", description: "Your native project is ready." })
      onCreated?.(payload.project)
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: "Could not create project", description: e.message, variant: "destructive" })
    }
  }

  async function finalizeConnection() {
    try {
      if (!repoValid) {
        toast({ title: "Validate repository first", variant: "destructive" })
        return
      }
      if (!name.trim()) {
        toast({ title: "Name required", description: "Please provide a project name.", variant: "destructive" })
        return
      }
      const selectedAgents = agents.filter((a) => a.selected)
      if (!userId) {
        toast({
          title: "User ID required",
          description: "Provide a user ID to link agents (matches users.id in your DB).",
          variant: "destructive",
        })
        return
      }

      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: "github" as const,
        repo_url: repoUrl,
        pinned: true,
        metadata: { created_via: "wizard" },
        repo: repoValid,
        user_id: userId,
        agents: selectedAgents.map(({ selected, ...a }) => a),
        policy_ids: Object.entries(selectedPolicies)
          .filter(([, v]) => v)
          .map(([k]) => k),
      }
      const res = await fetch("/api/projects/finalize-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || "Failed to connect project")

      toast({
        title: "Project connected",
        description: `Linked ${payload?.agentIds?.length ?? 0} agent(s) and ${payload?.policyIds?.length ?? 0} policy(ies).`,
      })
      onCreated?.(payload.project)
      onOpenChange(false)
    } catch (e: any) {
      toast({ title: "Connection failed", description: e.message, variant: "destructive" })
    }
  }

  function onPick(type: "connect" | "new") {
    setStep(type === "connect" ? "connect" : "new")
  }

  function toggleAgent(index: number, field: keyof DetectedAgent, value: any) {
    setAgents((prev) => {
      const next = [...prev]
      // @ts-expect-error dynamic
      next[index][field] = value
      return next
    })
  }

  function summaryCounts() {
    const selected = agents.filter((a) => a.selected).length
    const policiesCount = Object.values(selectedPolicies).filter(Boolean).length
    return { selected, policiesCount }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card
              role="button"
              tabIndex={0}
              onClick={() => onPick("connect")}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Connect existing
                </CardTitle>
                <CardDescription>Link a GitHub repository and auto-detect agents.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Validate repo URL, scan for agents, apply governance in one flow.
              </CardContent>
            </Card>

            <Card
              role="button"
              tabIndex={0}
              onClick={() => onPick("new")}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="h-5 w-5" />
                  Start native
                </CardTitle>
                <CardDescription>Use a template to scaffold a new project.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Governance-first setup with recommended defaults.
              </CardContent>
            </Card>
          </div>
        )}

        {step === "connect" && (
          <div className="space-y-6">
            <Tabs defaultValue="github">
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="github" className="gap-2">
                  <Github className="h-4 w-4" /> GitHub Repo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="github" className="space-y-4">
                <div className="grid gap-3">
                  <Label htmlFor="repo">Repository URL</Label>
                  <Input
                    id="repo"
                    placeholder="https://github.com/owner/repo"
                    value={repoUrl}
                    onChange={(e) => setRepoUrl(e.target.value)}
                    aria-describedby="repo-help"
                  />
                  <p id="repo-help" className="text-xs text-muted-foreground">
                    We use the GitHub API for validation and scanning. Public repos require no token.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-1">
                      <Label htmlFor="branch">Branch</Label>
                      <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
                    </div>
                    <div className="sm:col-span-1">
                      <Label htmlFor="proj-name">Project name</Label>
                      <Input
                        id="proj-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Optional; defaults to repo name"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <Label htmlFor="desc">Description</Label>
                      <Input
                        id="desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={validateGitHub} disabled={!repoUrl || repoChecking}>
                    {repoChecking ? "Validating..." : "Validate"}
                  </Button>
                  <Button onClick={scanForAgents} disabled={!repoValid || scanning} className="gap-2">
                    <ScanSearch className="h-4 w-4" />
                    {scanning ? "Scanning..." : "Scan for agents"}
                  </Button>
                </div>

                {repoValid && (
                  <Card aria-live="polite">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        {repoValid.owner}/{repoValid.repo}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Branch: <Badge variant="secondary">{repoValid.branch}</Badge>
                        {repoValid.default_branch && (
                          <span className="text-xs">Default: {repoValid.default_branch}</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <a
                        className="inline-flex items-center gap-1 text-sm text-primary underline"
                        href={`https://github.com/${repoValid.owner}/${repoValid.repo}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open on GitHub <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("choose")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={validateGitHub} disabled={!repoUrl || repoChecking}>
                  {repoChecking ? "Validating..." : "Validate"}
                </Button>
                <Button onClick={scanForAgents} disabled={!repoValid || scanning} className="gap-2">
                  <ScanSearch className="h-4 w-4" />
                  {scanning ? "Scanning..." : "Scan for agents"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === "detect" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanSearch className="h-5 w-5" />
                  Detected agents
                </CardTitle>
                <CardDescription>Select which agents to connect and adjust details if needed.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {agents.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No agents detected. You can go back or continue to policies.
                  </p>
                )}
                <div className="grid gap-4">
                  {agents.map((a, i) => (
                    <div key={a.path} className="rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={!!a.selected}
                          onCheckedChange={(v) => toggleAgent(i, "selected", Boolean(v))}
                        />
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">File</Badge>
                            <span className="text-sm text-muted-foreground">{a.path}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-4">
                        <div>
                          <Label>Name</Label>
                          <Input value={a.name} onChange={(e) => toggleAgent(i, "name", e.target.value)} />
                        </div>
                        <div>
                          <Label>Provider</Label>
                          <Select value={a.provider || "openai"} onValueChange={(v) => toggleAgent(i, "provider", v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="openai">OpenAI</SelectItem>
                              <SelectItem value="anthropic">Anthropic</SelectItem>
                              <SelectItem value="xai">xAI</SelectItem>
                              <SelectItem value="google">Google</SelectItem>
                              <SelectItem value="unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Model</Label>
                          <Input
                            value={a.model || ""}
                            onChange={(e) => toggleAgent(i, "model", e.target.value)}
                            placeholder="e.g., gpt-4o"
                          />
                        </div>
                        <div>
                          <Label>Endpoint</Label>
                          <Input
                            value={a.endpoint || ""}
                            onChange={(e) => toggleAgent(i, "endpoint", e.target.value)}
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("connect")}>
                Back
              </Button>
              <Button onClick={loadPolicies} className="gap-2">
                <Shield className="h-4 w-4" />
                Configure policies
              </Button>
            </div>
          </div>
        )}

        {step === "policies" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Governance policies
                </CardTitle>
                <CardDescription>Select policies to apply to this project and its agents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {policies.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No policies found. You can proceed without policies.</p>
                ) : (
                  <div className="grid gap-3">
                    {policies.map((p) => (
                      <label key={p.id} className="flex items-start gap-3 rounded-md border p-3 hover:bg-muted/30">
                        <Checkbox
                          checked={!!selectedPolicies[p.id]}
                          onCheckedChange={(v) => setSelectedPolicies((prev) => ({ ...prev, [p.id]: Boolean(v) }))}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{p.name}</span>
                            {p.severity && <Badge variant="secondary">{p.severity}</Badge>}
                          </div>
                          {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("detect")}>
                Back
              </Button>
              <Button onClick={() => setStep("review")}>Review</Button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Review & connect
                </CardTitle>
                <CardDescription>Confirm details before connecting your project and agents.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Project name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>Repository</Label>
                    <Input value={repoUrl} readOnly />
                  </div>
                  <div>
                    <Label>Branch</Label>
                    <Input value={branch} readOnly />
                  </div>
                  <div>
                    <Label>User ID (for agent linking)</Label>
                    <Input
                      value={userId}
                      placeholder="UUID matching users.id"
                      onChange={(e) => setUserId(e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border p-3">
                    <div className="font-medium">Agents to connect</div>
                    <p className="text-sm text-muted-foreground">
                      {summaryCounts().selected} selected of {agents.length} detected
                    </p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {agents
                        .filter((a) => a.selected)
                        .map((a) => (
                          <li key={a.path} className="flex items-center justify-between">
                            <span className="truncate">{a.name}</span>
                            <Badge variant="outline">{a.provider || "unknown"}</Badge>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div className="rounded-lg border p-3">
                    <div className="font-medium">Policies to apply</div>
                    <p className="text-sm text-muted-foreground">{summaryCounts().policiesCount} selected</p>
                    <ul className="mt-2 space-y-1 text-sm">
                      {policies
                        .filter((p) => selectedPolicies[p.id])
                        .map((p) => (
                          <li key={p.id} className="flex items-center justify-between">
                            <span className="truncate">{p.name}</span>
                            {p.severity && <Badge variant="secondary">{p.severity}</Badge>}
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("policies")}>
                Back
              </Button>
              <Button onClick={finalizeConnection} className="gap-2">
                <Github className="h-4 w-4" />
                Connect Project and Agents
              </Button>
            </div>
          </div>
        )}

        {step === "new" && (
          <div className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Project name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Granular Governance"
              />
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="grid gap-3">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="governance">AI Governance (recommended)</SelectItem>
                  <SelectItem value="analytics">Analytics Starter</SelectItem>
                  <SelectItem value="empty">Empty project</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Starts with curated navigation and demo entities for faster onboarding.
              </p>
            </div>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("choose")}>
                Back
              </Button>
              <Button onClick={createNative} className="gap-2">
                <FolderKanban className="h-4 w-4" />
                Create
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const u = new URL(url)
    if (u.hostname !== "github.com") return null
    const parts = u.pathname.split("/").filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0], repo: parts[1].replace(/\.git$/, "") }
  } catch {
    return null
  }
}
