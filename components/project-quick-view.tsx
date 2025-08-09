"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Copy, ClipboardCheck, Activity, ShieldCheck, GitBranch, FileText, Check, Bot, LinkIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  project: any | null
  onUpdated?: () => void
  onDefault?: (id: string) => void
}

export function ProjectQuickView({ open, onOpenChange, project, onUpdated, onDefault }: Props) {
  const { toast } = useToast()
  const [copied, setCopied] = React.useState<string | null>(null)
  const [policies, setPolicies] = React.useState<{ id: string; name: string }[]>([])
  const [selectedPolicies, setSelectedPolicies] = React.useState<string[]>([])
  const [applying, setApplying] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      fetch("/api/policies")
        .then((r) => r.json())
        .then((data) => {
          const items = (data.items ?? data.policies ?? []).map((p: any) => ({ id: String(p.id), name: p.name }))
          setPolicies(items)
        })
        .catch(() => setPolicies([]))
    }
  }, [open])

  if (!project) return null

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(null), 1200)
  }

  async function applyPolicies() {
    setApplying(true)
    try {
      const res = await fetch(`/api/projects/${project.id}/apply-policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ policy_ids: selectedPolicies }),
      })
      if (!res.ok) throw new Error("Failed to apply policies")
      toast({ title: "Policies applied", description: `${selectedPolicies.length} policy(s) applied to this project.` })
      onUpdated?.()
    } catch (e: any) {
      toast({ title: "Could not apply", description: e.message, variant: "destructive" })
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Project Quick View</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                {project.name}
                {project.pinned && <Badge variant="secondary">Pinned</Badge>}
              </CardTitle>
              <CardDescription>{project.description || "No description provided"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <div className="rounded border px-3 py-2 text-sm bg-muted/50">{project.type}</div>
                </div>
                <div className="space-y-1">
                  <Label>Created</Label>
                  <div className="rounded border px-3 py-2 text-sm bg-muted/50">
                    {project.created_at ? new Date(project.created_at).toLocaleString() : "—"}
                  </div>
                </div>
                {project.repo_url && (
                  <div className="space-y-1 sm:col-span-2">
                    <Label>Repository</Label>
                    <div className="flex gap-2">
                      <Input readOnly value={project.repo_url} />
                      <Button variant="outline" onClick={() => copy(project.repo_url, "repo")} title="Copy repo link">
                        {copied === "repo" ? <ClipboardCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" asChild>
                        <a href={project.repo_url} target="_blank" rel="noreferrer">
                          <LinkIcon className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Apply Policies</Label>
                <div className="grid gap-2">
                  <div className="grid gap-2 md:grid-cols-2">
                    {policies.map((p) => {
                      const s = selectedPolicies.includes(p.id)
                      return (
                        <Button
                          key={p.id}
                          variant={s ? "default" : "outline"}
                          onClick={() =>
                            setSelectedPolicies((arr) =>
                              arr.includes(p.id) ? arr.filter((x) => x !== p.id) : [...arr, p.id],
                            )
                          }
                          className="justify-start"
                        >
                          <ShieldCheck className="h-4 w-4 mr-2" />
                          {p.name}
                          {s && <Check className="h-4 w-4 ml-auto" />}
                        </Button>
                      )
                    })}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setSelectedPolicies([])}>
                      Clear
                    </Button>
                    <Button onClick={applyPolicies} disabled={applying || selectedPolicies.length === 0}>
                      {applying ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Agent Sync</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Sync connected agents for this project to pull latest health and versions.
                </p>
                <Button className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Sync Agents
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Generate an audit/compliance report scoped to this project.
                </p>
                <Select defaultValue="soc2">
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="soc2">SOC 2</SelectItem>
                    <SelectItem value="gdpr">GDPR</SelectItem>
                    <SelectItem value="security-audit">Security Audit</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  onClick={async () => {
                    const type =
                      (document.querySelector('[role="combobox"][aria-expanded="false"] input') as HTMLInputElement)
                        ?.value || "soc2"
                    const r = await fetch("/api/reports/generate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type }),
                    })
                    if (r.ok) toast({ title: "Report started" })
                  }}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Generate
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Set as Default</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">Select as your default workspace project.</p>
                <Button className="w-full" onClick={() => onDefault?.(project.id)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Set Default
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProjectQuickView
