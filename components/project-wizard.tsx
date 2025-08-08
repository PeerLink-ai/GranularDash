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
import { ExternalLink, Github, Hammer, FolderKanban, CheckCircle2, Terminal } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated?: (project: any) => void
}

type Step = "choose" | "connect" | "new"

export function ProjectWizard({ open, onOpenChange, onCreated }: Props) {
  const [step, setStep] = React.useState<Step>("choose")

  // Shared
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")

  // New native
  const [template, setTemplate] = React.useState<"governance" | "analytics" | "empty">("governance")

  // Connect: GitHub
  const [repoUrl, setRepoUrl] = React.useState("")
  const [branch, setBranch] = React.useState("main")
  const [repoValid, setRepoValid] = React.useState<null | { full_name: string; description?: string }>(null)
  const [repoChecking, setRepoChecking] = React.useState(false)
  const lastValidatedRef = React.useRef<string | null>(null)

  // External
  const [externalLink, setExternalLink] = React.useState("")

  const { toast } = useToast()

  React.useEffect(() => {
    if (!open) {
      setStep("choose")
      setName("")
      setDescription("")
      setTemplate("governance")
      setRepoUrl("")
      setBranch("main")
      setRepoValid(null)
      setExternalLink("")
      lastValidatedRef.current = null
    }
  }, [open])

  // Auto-validate GitHub URL (debounced)
  React.useEffect(() => {
    if (!repoUrl) {
      setRepoValid(null)
      lastValidatedRef.current = null
      return
    }
    const parsed = parseGitHubUrl(repoUrl)
    if (!parsed) {
      setRepoValid(null)
      lastValidatedRef.current = null
      return
    }
    if (lastValidatedRef.current === repoUrl || repoChecking) return
    const t = setTimeout(() => {
      validateGitHub().then(() => {
        lastValidatedRef.current = repoUrl
      }).catch(() => {})
    }, 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl])

  function onPick(type: "connect" | "new") {
    setStep(type === "connect" ? "connect" : "new")
  }

  async function validateGitHub() {
    try {
      setRepoChecking(true)
      setRepoValid(null)
      const parsed = parseGitHubUrl(repoUrl)
      if (!parsed) throw new Error("Please enter a valid GitHub repository URL.")
      const res = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`)
      if (!res.ok) throw new Error(`Repository not accessible (${res.status}).`)
      const data = await res.json()
      setRepoValid({ full_name: data.full_name, description: data.description ?? undefined })
      if (!name) setName(data.name)
      if (!description && data.description) setDescription(data.description)
    } catch (e: any) {
      setRepoValid(null)
      throw e
    } finally {
      setRepoChecking(false)
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
    } catch (e: any) {
      toast({ title: "Could not create project", description: e.message, variant: "destructive" })
    }
  }

  async function connectGitHub() {
    try {
      const parsed = parseGitHubUrl(repoUrl)
      if (!parsed) {
        toast({ title: "Invalid URL", description: "Enter a valid GitHub repo URL.", variant: "destructive" })
        return
      }
      const body = {
        name: name || parsed.repo,
        description: description || undefined,
        type: "github" as const,
        repo_url: repoUrl,
        metadata: { owner: parsed.owner, repo: parsed.repo, branch },
        pinned: true,
      }
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || "Failed to connect repository")
      toast({ title: "Repository connected", description: "Linked to your dashboard." })
      onCreated?.(payload.project)
    } catch (e: any) {
      toast({ title: "Could not connect", description: e.message, variant: "destructive" })
    }
  }

  async function connectExternal() {
    try {
      if (!name.trim() || !externalLink.trim()) {
        toast({ title: "Missing fields", description: "Provide a name and an external link.", variant: "destructive" })
        return
      }
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        type: "external" as const,
        repo_url: externalLink.trim(),
        metadata: { how: "terminal" },
        pinned: false,
      }
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) throw new Error(payload?.error || "Failed to create external reference")
      toast({ title: "External project added" })
      onCreated?.(payload.project)
    } catch (e: any) {
      toast({ title: "Could not add", description: e.message, variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>New Project</DialogTitle>
        </DialogHeader>

        {step === "choose" && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Card role="button" tabIndex={0} onClick={() => onPick("connect")} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Connect existing
                </CardTitle>
                <CardDescription>Link a GitHub repository or reference a terminal-based project.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Validate repo URL, set branch, and connect in seconds.
              </CardContent>
            </Card>

            <Card role="button" tabIndex={0} onClick={() => onPick("new")} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hammer className="h-5 w-5" />
                  Start native
                </CardTitle>
                <CardDescription>Use our governance templates to start quickly.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Opinionated setup designed for AI governance and analytics.
              </CardContent>
            </Card>
          </div>
        )}

        {step === "connect" && (
          <div className="space-y-6">
            <Tabs defaultValue="github">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="github" className="gap-2">
                  <Github className="h-4 w-4" /> GitHub Repo
                </TabsTrigger>
                <TabsTrigger value="terminal" className="gap-2">
                  <Terminal className="h-4 w-4" /> Terminal/External
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
                    Public repos auto-validate after you paste a valid URL.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="branch">Branch</Label>
                      <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="proj-name">Project name</Label>
                      <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional; defaults to repo name" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="desc">Description</Label>
                    <Input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={validateGitHub} disabled={!repoUrl || repoChecking} className="sm:hidden">
                    {repoChecking ? "Validating..." : "Validate"}
                  </Button>
                  <Button onClick={connectGitHub} disabled={!repoUrl || !repoValid || repoChecking}>
                    {repoChecking ? "Checking..." : "Connect"}
                  </Button>
                </div>

                {repoValid && (
                  <Card aria-live="polite">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle2 className="h-5 w-5" />
                        {repoValid.full_name}
                      </CardTitle>
                      {repoValid.description && <CardDescription>{repoValid.description}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      <a
                        className="inline-flex items-center gap-1 text-sm text-primary underline"
                        href={`https://github.com/${repoValid.full_name}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open on GitHub <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="terminal" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Terminal className="h-5 w-5" /> Initialize locally
                    </CardTitle>
                    <CardDescription>Run these commands to scaffold with Next.js App Router and Tailwind.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <code className="block rounded-md bg-muted p-3 text-sm">
                      npx create-next-app@latest my-app --ts --tailwind --app --eslint --import-alias "@/*"
                    </code>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Link to Vercel (optional)</p>
                      <code className="block rounded-md bg-muted p-3 text-sm">npx vercel link</code>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-3">
                  <Label htmlFor="ext-name">Project name</Label>
                  <Input id="ext-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My external app" />
                  <Label htmlFor="ext-link">External link (repo or docs)</Label>
                  <Input id="ext-link" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} placeholder="https://github.com/org/repo or https://project-url.com" />
                  <Label htmlFor="ext-desc">Description</Label>
                  <Input id="ext-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => window.open("https://github.com/new", "_blank")}>
                    Create repo <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                  <Button onClick={connectExternal}>Save reference</Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep("choose")}>Back</Button>
            </div>
          </div>
        )}

        {step === "new" && (
          <div className="space-y-6">
            <div className="grid gap-3">
              <Label htmlFor="name">Project name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Granular Governance" />
              <Label htmlFor="description">Description</Label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>

            <div className="grid gap-3">
              <Label>Template</Label>
              <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                <SelectTrigger><SelectValue placeholder="Choose a template" /></SelectTrigger>
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
              <Button variant="ghost" onClick={() => setStep("choose")}>Back</Button>
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
