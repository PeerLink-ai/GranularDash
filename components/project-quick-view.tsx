"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ExternalLink, GitBranch, Rocket, ShieldCheck, Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export type ProjectQuickViewProject = {
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

type Props = {
  open?: boolean
  project?: ProjectQuickViewProject | null
  onOpenChange?: (open: boolean) => void
  onUpdated?: () => void | Promise<void>
  onDefault?: (id: string) => void
}

export function ProjectQuickView({
  open = false,
  project = null,
  onOpenChange = () => {},
  onUpdated,
  onDefault,
}: Props) {
  const { toast } = useToast()
  const [busy, setBusy] = React.useState(false)

  async function applyPolicies() {
    if (!project) return
    setBusy(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/apply-policies`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to apply policies")
      toast({ title: "Policies applied", description: "Recommended policies have been applied to this project." })
      await onUpdated?.()
    } catch (e: any) {
      toast({ title: "Could not apply policies", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  async function generateReport(kind: "soc2" | "gdpr") {
    if (!project) return
    setBusy(true)
    try {
      // Request a signed download URL for the report type
      const res = await fetch(`/api/reports/${kind}/signed-url?project_id=${encodeURIComponent(project.id)}`, {
        method: "GET",
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Failed to get signed URL")
      const data = await res.json()
      const url = data?.url as string | undefined
      if (!url) throw new Error("Missing signed URL")
      window.open(url, "_blank", "noopener,noreferrer")
      toast({ title: "Report is downloading", description: `${kind.toUpperCase()} report generated.` })
    } catch (e: any) {
      toast({ title: "Could not generate report", description: e.message, variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="truncate">{project ? project.name : "Project details"}</SheetTitle>
          <SheetDescription className="line-clamp-2">
            {project?.description ?? "Review project metadata, repos, and quick actions."}
          </SheetDescription>
        </SheetHeader>

        {!project ? (
          <div className="mt-6 text-sm text-muted-foreground">No project selected.</div>
        ) : (
          <div className="mt-6 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Overview</CardTitle>
                <CardDescription>Key properties and links</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {project.type}
                  </Badge>
                  {project.pinned ? <Badge className="bg-emerald-600 hover:bg-emerald-700">Pinned</Badge> : null}
                </div>
                {project.repo_url ? (
                  <div className="flex items-center gap-2 text-sm">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    <a
                      className="text-primary hover:underline break-all"
                      href={project.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {project.repo_url}
                      <ExternalLink className="ml-1 inline-block h-3.5 w-3.5" />
                    </a>
                  </div>
                ) : null}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Created</div>
                    <div className="tabular-nums">{new Date(project.created_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Updated</div>
                    <div className="tabular-nums">{new Date(project.updated_at).toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Metadata</CardTitle>
                <CardDescription>Repo signals and custom attributes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-muted p-3 text-xs overflow-auto max-h-56">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(project.metadata ?? {}, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Separator />
              <div className="flex flex-col sm:flex-row gap-2">
                <Button className="gap-2" onClick={applyPolicies} disabled={busy}>
                  <ShieldCheck className="h-4 w-4" />
                  Apply recommended policies
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => generateReport("soc2")} disabled={busy}>
                  <Rocket className="h-4 w-4" />
                  Generate SOC 2
                </Button>
                <Button
                  variant="outline"
                  className="gap-2 bg-transparent"
                  onClick={() => generateReport("gdpr")}
                  disabled={busy}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Generate GDPR
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  className="gap-2"
                  onClick={() => project && onDefault?.(project.id)}
                  disabled={busy}
                >
                  <Star className="h-4 w-4" />
                  Set as default
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// Keep default export for any existing default imports
export default ProjectQuickView
