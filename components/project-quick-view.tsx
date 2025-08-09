"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { FileText, GitBranch, Shield, Users } from "lucide-react"

type Project = {
  id: string
  name: string
  repoUrl?: string
  agentCount?: number
  policyCount?: number
}

type Props = {
  project?: Project
  triggerLabel?: string
}

export function ProjectQuickView({
  project = {
    id: "demo",
    name: "Granular Demo",
    repoUrl: "https://github.com/acme/granular",
    agentCount: 3,
    policyCount: 5,
  },
  triggerLabel = "Quick View",
}: Props) {
  const [open, setOpen] = useState(false)

  const handleGenerateReport = async (type: string) => {
    try {
      const res = await fetch(`/api/reports/${type}/signed-url?projectId=${encodeURIComponent(project.id)}`, {
        method: "GET",
      })
      if (!res.ok) throw new Error("Failed to get signed URL")
      const { url } = await res.json()
      window.open(url, "_blank", "noopener,noreferrer")
    } catch (e) {
      console.error(e)
      alert("Failed to generate report")
    }
  }

  const handleApplyPolicies = async () => {
    try {
      const res = await fetch(`/api/projects/${project.id}/apply-policies`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to apply policies")
      alert("Policies applied to project")
    } catch (e) {
      console.error(e)
      alert("Failed to apply policies")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-lg sm:max-w-2xl p-0">
        <DialogHeader className="px-4 pb-2 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle className="truncate">{project.name}</DialogTitle>
          <DialogDescription>Project summary, agents, and policies</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="px-4 py-4 sm:px-6 sm:py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <div className="text-sm text-muted-foreground truncate">Repository</div>
                </div>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block truncate text-sm font-medium hover:underline"
                >
                  {project.repoUrl}
                </a>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <div className="text-sm text-muted-foreground">Agents</div>
                </div>
                <div className="mt-2 text-2xl font-semibold">{project.agentCount ?? "—"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <div className="text-sm text-muted-foreground">Policies</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="secondary">{(project.policyCount ?? 0).toString()} total</Badge>
                  <Badge>Active</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <div className="text-sm text-muted-foreground">Reports</div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleGenerateReport("soc2")}>
                    SOC 2
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleGenerateReport("gdpr")}>
                    GDPR
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button className="order-2 sm:order-none bg-transparent" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Button className="order-1 sm:order-none" onClick={handleApplyPolicies}>
              Apply Recommended Policies
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectQuickView
