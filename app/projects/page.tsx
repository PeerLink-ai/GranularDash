"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectWizard } from "@/components/project-wizard"
import { ProjectCard } from "@/components/project-card"
import { Plus, RefreshCw } from "lucide-react"

export type Project = {
  id: string
  name: string
  description?: string | null
  type: "native" | "github" | "external"
  repo_url?: string | null
  metadata?: any
  pinned?: boolean
  created_at?: string
  updated_at?: string
}

export default function ProjectsPage() {
  const [open, setOpen] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>([])
  const [defaultId, setDefaultId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/projects", { cache: "no-store" })
      const data = await res.json()
      setProjects(Array.isArray(data.projects) ? data.projects : [])
      // restore default from localStorage
      setDefaultId(localStorage.getItem("default_project") || null)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  const onPin = async (p: Project) => {
    const res = await fetch(`/api/projects/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !p.pinned }),
    })
    if (res.ok) load()
  }
  const onDefault = (p: Project) => {
    localStorage.setItem("default_project", p.id)
    setDefaultId(p.id)
  }
  const onDelete = async (p: Project) => {
    const ok = confirm(`Delete project "${p.name}"? This cannot be undone.`)
    if (!ok) return
    const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" })
    if (res.ok) load()
  }

  return (
    <main className="mx-auto w-full max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">Connect Git repos or create native workspaces.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} disabled={loading} className="gap-2 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No projects yet</CardTitle>
            <CardDescription>Connect your first repository or create a native workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setOpen(true)}>Get started</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard
              key={p.id}
              project={p as any}
              isDefault={defaultId === p.id}
              onPin={() => onPin(p)}
              onDefault={() => onDefault(p)}
              onDelete={() => onDelete(p)}
            />
          ))}
        </div>
      )}

      <ProjectWizard open={open} onOpenChange={setOpen} onCreated={() => load()} />
    </main>
  )
}
