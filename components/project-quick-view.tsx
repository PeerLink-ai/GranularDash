"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Github,
  ExternalLink,
  FolderKanban,
  Star,
  Pin,
  PinOff,
  CalendarClock,
  Link2,
  Cog,
  Activity,
  ShieldCheck,
  FileDown,
  Network,
  LinkIcon,
  CheckCircle2,
  AlertCircle,
  Clipboard,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// NOTE: keep this in sync with app/projects/page
export type Project = {
  id: string
  name: string
  description?: string
  type: "github" | "external" | "native" | string
  repo_url?: string | null
  pinned?: boolean
  created_at: string
}

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
  const [testing, setTesting] = React.useState<"idle" | "running" | "ok" | "error">("idle")
  const [lastTestAt, setLastTestAt] = React.useState<string | null>(null)
  const [isPending, startTransition] = React.useTransition()

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

  async function runConnectivityTest() {
    setTesting("running")
    try {
      const res = await fetch("/api/sdk/test", { method: "POST" })
      if (!res.ok) throw new Error(await res.text())
      setTesting("ok")
      setLastTestAt(new Date().toLocaleString())
      toast({ title: "SDK connectivity OK", description: "All checks passed." })
    } catch (e: any) {
      setTesting("error")
      setLastTestAt(new Date().toLocaleString())
      toast({ title: "SDK connectivity failed", description: e.message || "See logs.", variant: "destructive" })
    }
  }

  async function exportReport() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/reports/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reportType: "project-summary", projectId: project.id }),
        })
        if (!res.ok) throw new Error(await res.text())
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${project.name.replace(/\s+/g, "-").toLowerCase()}-report.pdf`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
        toast({ title: "Report exported", description: "Project summary downloaded." })
      } catch (e: any) {
        toast({ title: "Export failed", description: e.message || "Try again later.", variant: "destructive" })
      }
    })
  }

  async function assignPolicies() {
    router.push("/policies-rules")
    onOpenChange(false)
  }

  async function syncAgents() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/agents", { method: "GET" })
        if (!res.ok) throw new Error(await res.text())
        toast({ title: "Agents synced", description: "Latest agent list loaded." })
      } catch (e: any) {
        toast({ title: "Sync failed", description: e.message || "Could not sync agents.", variant: "destructive" })
      }
    })
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Copied", description: label }),
      () => toast({ title: "Copy failed", description: "Unable to copy to clipboard.", variant: "destructive" }),
    )
  }

  function ActionTile({
    icon,
    title,
    desc,
    onClick,
    disabled,
  }: {
    icon: React.ReactNode
    title: string
    desc: string
    onClick: () => void
    disabled?: boolean
  }) {
    return (
      <button
        className="rounded-md border bg-background p-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-50 w-full"
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex items-start gap-3">
          <div className="rounded-md border size-9 grid place-items-center">{icon}</div>
          <div className="min-w-0">
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{desc}</div>
          </div>
        </div>
      </button>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        {/* Header banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-neutral-800 to-zinc-900 text-white px-5 py-6">
          <div
            className="absolute inset-0 opacity-20"
            style={{ backgroundImage: "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.2), transparent 40%)" }}
          />
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
                {project.pinned && (
                  <Badge variant="outline" className="border-white/30 text-white bg-white/10">
                    Pinned
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            <Button size="sm" onClick={openPrimary} className="bg-white text-black hover:bg-white/90">
              {isNative ? "Open workspace" : "Open"}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={openSettings}
              className="bg-white/10 text-white hover:bg-white/20"
            >
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
          {/* Identity */}
          <Card>
            <CardContent className="p-4 text-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Project ID</span>
                <button
                  onClick={() => copy(project.id, "Project ID copied")}
                  className="inline-flex items-center gap-2 hover:underline"
                >
                  <span className="font-mono text-xs truncate max-w-[60%]" title={project.id}>
                    {project.id}
                  </span>
                  <Clipboard className="h-3.5 w-3.5" />
                </button>
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
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault()
                        copy(project.repo_url!, "Repository URL copied")
                      }}
                      className="mt-2"
                    >
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Copy repo URL
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Health and actions */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Project health</div>
                <div className="flex items-center gap-2">
                  {testing === "ok" && (
                    <Badge variant="secondary" className="text-green-700 bg-green-100 border-green-200">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Healthy
                    </Badge>
                  )}
                  {testing === "error" && (
                    <Badge variant="secondary" className="text-red-700 bg-red-100 border-red-200">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" /> Issue
                    </Badge>
                  )}
                  {lastTestAt && <span className="text-xs text-muted-foreground">Last test {lastTestAt}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <ActionTile
                  icon={<Activity className="h-4 w-4" />}
                  title="Run SDK connectivity"
                  desc="Verify API keys and endpoints"
                  onClick={runConnectivityTest}
                />
                <ActionTile
                  icon={<Network className="h-4 w-4" />}
                  title="Sync agents"
                  desc="Refresh connected agents"
                  onClick={syncAgents}
                  disabled={isPending}
                />
                <ActionTile
                  icon={<ShieldCheck className="h-4 w-4" />}
                  title="Assign policies"
                  desc="Open policy manager"
                  onClick={assignPolicies}
                />
                <ActionTile
                  icon={<FileDown className="h-4 w-4" />}
                  title="Export report"
                  desc="Download project summary"
                  onClick={exportReport}
                />
              </div>
            </CardContent>
          </Card>

          {/* Next steps */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Next steps</h3>
            <div className="grid gap-2">
              {isNative ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/agent-management")
                      onOpenChange(false)
                    }}
                  >
                    Open workspace
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/analytics")
                      onOpenChange(false)
                    }}
                  >
                    See analytics
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={openPrimary}>
                    Open repository
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push("/analytics")
                      onOpenChange(false)
                    }}
                  >
                    See analytics
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  onDefault?.(project.id)
                  toast({ title: "Default set", description: `${project.name} is your default workspace.` })
                }}
              >
                {/* Parent can also persist this server-side */}
                <Star className="h-4 w-4 mr-2" /> Make default
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
