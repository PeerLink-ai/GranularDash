"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Github, ExternalLink, FolderKanban, Star, StarOff, Pin, PinOff, CalendarClock, Link2, Cog } from 'lucide-react'
import type { Project } from "@/app/projects/page"
import { useToast } from "@/hooks/use-toast"

type Props = {
  open: boolean
  project: Project | null
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
  onDefault?: (id: string) => void
}

export function ProjectQuickView({ open, project, onOpenChange, onUpdated, onDefault }: Props) {
  const { toast } = useToast()
  const router = useRouter()
  const [working, setWorking] = React.useState(false)

  if (!project) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="p-0" />
      </Sheet>
    )
  }

  const isGithub = project.type === "github"
  const isExternal = project.type === "external"
  const isNative = project.type === "native"

  async function togglePin() {
    if (!project) return
    setWorking(true)
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !project.pinned }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Failed to update")
      onUpdated?.()
      toast({ title: project.pinned ? "Unpinned" : "Pinned", description: project.name })
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" })
    } finally {
      setWorking(false)
    }
  }

  function openPrimary() {
    if (isNative) {
      router.push("/agent-management")
      onOpenChange(false)
    } else if ((isGithub || isExternal) && project.repo_url) {
      window.open(project.repo_url, "_blank", "noopener,noreferrer")
    }
  }

  function openSettings() {
    router.push("/settings")
    onOpenChange(false)
  }

  function TypeIcon() {
    if (isGithub) return <Github className="h-4 w-4" />
    if (isNative) return <FolderKanban className="h-4 w-4" />
    return <ExternalLink className="h-4 w-4" />
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {/* Header banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-neutral-800 to-zinc-900 text-white px-5 py-6">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.2), transparent 40%)" }} />
          <div className="relative z-10 flex items-start gap-3">
            <div className="bg-white/10 rounded-md p-2">
              <TypeIcon />
            </div>
            <div className="min-w-0">
              <SheetTitle className="truncate">{project.name}</SheetTitle>
              <SheetDescription className="text-zinc-200 truncate">
                {project.description || "No description"}
              </SheetDescription>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
                  {project.type}
                </Badge>
                {project.pinned && <Badge variant="outline" className="border-white/30 text-white bg-white/10">Pinned</Badge>}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={openPrimary} className="bg-white text-black hover:bg-white/90">
              {isNative ? "Open workspace" : "Open"}
            </Button>
            <Button size="sm" variant="secondary" onClick={openSettings} className="bg-white/10 text-white hover:bg-white/20">
              <Cog className="h-4 w-4 mr-1" /> Settings
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={togglePin}
              disabled={working}
              className="bg-white/10 text-white hover:bg-white/20"
            >
              {project.pinned ? <PinOff className="h-4 w-4 mr-1" /> : <Pin className="h-4 w-4 mr-1" />}
              {project.pinned ? "Unpin" : "Pin"}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <Card>
            <CardContent className="p-4 text-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Project ID</span>
                <span className="font-mono text-xs truncate max-w-[60%]" title={project.id}>{project.id}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="inline-flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  {new Date(project.created_at).toLocaleString()}
                </span>
              </div>
              {(isGithub || isExternal) && project.repo_url && (
                <>
                  <Separator />
                  <a
                    href={project.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between hover:underline"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      Link
                    </span>
                    <span className="inline-flex items-center gap-1">
                      {project.repo_url}
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Next steps</h3>
            <div className="grid gap-2">
              {isNative ? (
                <>
                  <Button variant="outline" onClick={() => { router.push("/agent-management"); onOpenChange(false) }}>
                    Configure agents
                  </Button>
                  <Button variant="outline" onClick={() => { router.push("/policies-rules"); onOpenChange(false) }}>
                    Define policies & rules
                  </Button>
                  <Button variant="outline" onClick={() => { router.push("/audit-logs"); onOpenChange(false) }}>
                    View audit logs
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={openPrimary}>
                    Open repository
                  </Button>
                  <Button variant="outline" onClick={() => { router.push("/analytics"); onOpenChange(false) }}>
                    See analytics
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  onDefault?.(project.id)
                }}
              >
                { /* Parent will toast */ }
                <Star className="h-4 w-4 mr-2" /> Make default
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
