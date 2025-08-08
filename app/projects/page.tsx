"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Pin, PinOff, FolderKanban, Settings, Trash2, ExternalLink, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ProjectWizard } from "@/components/project-wizard"
import { ProjectCard } from "@/components/project-card"

export type Project = {
  id: string
  name: string
  description?: string | null
  type: "native" | "github" | "external"
  repo_url?: string | null
  metadata?: Record<string, any>
  pinned?: boolean
  created_at: string
  updated_at: string
}

const DEFAULT_KEY = "granular.defaultProjectId"

export default function ProjectsPage() {
  const [projects, setProjects] = React.useState<Project[]>([])
  const [loading, setLoading] = React.useState(true)
  const [query, setQuery] = React.useState("")
  const [open, setOpen] = React.useState(false)
  const [defaultId, setDefaultId] = React.useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  React.useEffect(() => {
    const def = localStorage.getItem(DEFAULT_KEY)
    if (def) setDefaultId(def)
  }, [])

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/projects", { cache: "no-store" })
      const data = await res.json()
      setProjects(data.projects ?? [])
    } catch (e: any) {
      toast({ title: "Failed to load projects", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    load()
  }, [load])

  const filtered = React.useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return projects
    return projects.filter((p) => (p.name + " " + (p.description ?? "") + " " + p.type).toLowerCase().includes(q))
  }, [projects, query])

  async function togglePin(p: Project) {
    try {
      const res = await fetch(`/api/projects/${p.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !p.pinned }),
      })
      if (!res.ok) throw new Error("Failed to update")
      await load()
    } catch (e: any) {
      toast({ title: "Could not update", description: e.message, variant: "destructive" })
    }
  }

  function setDefault(id: string) {
    localStorage.setItem(DEFAULT_KEY, id)
    setDefaultId(id)
    toast({ title: "Default project set", description: "This project will be selected by default." })
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      await load()
      if (defaultId === id) {
        localStorage.removeItem(DEFAULT_KEY)
        setDefaultId(null)
      }
      toast({ title: "Project deleted" })
    } catch (e: any) {
      toast({ title: "Could not delete", description: e.message, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Connect an existing repository or start a native project.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-8"
              aria-label="Search projects"
            />
          </div>
          <Button className="gap-2" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse h-40" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Get started with your first project</CardTitle>
            <CardDescription>
              Connect a GitHub repository or create a new native project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {filtered.some((p) => p.pinned) && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium">Pinned</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered
                  .filter((p) => p.pinned)
                  .map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      isDefault={defaultId === p.id}
                      onPin={() => togglePin(p)}
                      onDefault={() => setDefault(p.id)}
                      onDelete={() => deleteProject(p.id)}
                    />
                  ))}
              </div>
            </section>
          )}
          <section className="space-y-3">
            <h2 className="text-sm font-medium">All projects</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered
                .filter((p) => !p.pinned)
                .map((p) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    isDefault={defaultId === p.id}
                    onPin={() => togglePin(p)}
                    onDefault={() => setDefault(p.id)}
                    onDelete={() => deleteProject(p.id)}
                  />
                ))}
            </div>
          </section>
        </>
      )}

      <ProjectWizard
        open={open}
        onOpenChange={setOpen}
        onCreated={async (proj) => {
          setOpen(false)
          await load()
          setDefault(proj.id)
          // route to a relevant area after creation
          if (proj.type === "native") {
            // Go to agent management for native templates by default
            router.push("/agent-management")
          } else {
            router.refresh()
          }
        }}
      />
    </div>
  )
}
