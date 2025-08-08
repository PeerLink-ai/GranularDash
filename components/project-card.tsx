"use client"

import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Github, FolderKanban, ExternalLink, Pin, PinOff, Settings, Star, StarOff, Trash2, GitFork, Bug, TimerReset, Code2, Sparkles, ShieldCheck } from 'lucide-react'
import type { Project } from "@/app/projects/page"

type Stats = {
  stars: number
  forks: number
  issues: number
}

function relativeTime(iso?: string) {
  if (!iso) return "—"
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "just now"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(months / 12)
  return `${years}y ago`
}

function formatNumber(n?: number) {
  if (n == null) return "0"
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return `${n}`
}

function getTypeMeta(type: Project["type"]) {
  switch (type) {
    case "github":
      return {
        label: "GitHub",
        icon: Github,
        gradient: "bg-[linear-gradient(135deg,#0f0f11,45%,#1e2024)]",
        badgeVariant: "secondary" as const,
      }
    case "external":
      return {
        label: "External",
        icon: ExternalLink,
        gradient: "bg-[linear-gradient(135deg,#3b2f1a,45%,#4a3a1f)]",
        badgeVariant: "outline" as const,
      }
    default:
      return {
        label: "Native",
        icon: FolderKanban,
        gradient: "bg-[linear-gradient(135deg,#0d291f,45%,#133227)]",
        badgeVariant: "default" as const,
      }
  }
}

function ActivitySparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-1 h-10">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-1.5 rounded-sm bg-gradient-to-t from-muted-foreground/30 to-foreground/70"
          style={{ height: `${Math.max(10, (v / max) * 100)}%` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function Contributors({
  names,
}: {
  names: string[]
}) {
  const shown = names.slice(0, 5)
  const extra = names.length - shown.length
  return (
    <div className="flex -space-x-2">
      {shown.map((n, i) => (
        <div
          key={`${n}-${i}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[10px] font-medium"
          title={n}
          aria-label={n}
        >
          {n
            .split(" ")
            .map((p) => p[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
      ))}
      {extra > 0 && (
        <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted ring-2 ring-background text-[10px] font-medium">
          +{extra}
        </div>
      )}
    </div>
  )
}

export function ProjectCard({
  project,
  isDefault,
  onPin,
  onDefault,
  onDelete,
}: {
  project: Project
  isDefault: boolean
  onPin: () => void
  onDefault: () => void
  onDelete: () => void
}) {
  const typeMeta = getTypeMeta(project.type)
  const Icon = typeMeta.icon

  const stats: Stats = {
    stars:
      Number(
        (project.metadata as any)?.github?.stars ??
          (project.metadata as any)?.stars
      ) || 0,
    forks:
      Number(
        (project.metadata as any)?.github?.forks ??
          (project.metadata as any)?.forks
      ) || 0,
    issues:
      Number(
        (project.metadata as any)?.github?.issues ??
          (project.metadata as any)?.issues
      ) || 0,
  }

  const languages: { name: string; color?: string }[] =
    (project.metadata as any)?.languages ??
    []

  const contributors: string[] =
    (project.metadata as any)?.contributors ??
    ["Ada Lovelace", "Grace Hopper", "Alan Turing"]

  const activity: number[] =
    (project.metadata as any)?.activity ??
    [2, 4, 3, 6, 5, 8, 7, 5, 6, 4, 3, 7]

  const externalHref =
    project.type !== "native" && project.repo_url ? project.repo_url : undefined

  const primaryCtaLabel =
    externalHref ? "Open" : "Open workspace"
  const primaryCtaIcon =
    externalHref ? ExternalLink : FolderKanban

  const statusLabel =
    (project.metadata as any)?.status ??
    (project.type === "github" ? "Connected" : "Ready")

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:border-foreground/20 hover:shadow-md"
      )}
    >
      {/* Accent ring on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-lg ring-0 ring-transparent transition-[ring] duration-300 group-hover:ring-1 group-hover:ring-foreground/10" />

      {/* Gradient top */}
      <div
        className={cn(
          "h-16 w-full",
          typeMeta.gradient,
          "relative"
        )}
      >
        <div className="absolute -bottom-6 left-5 flex items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 shadow-sm ring-1 ring-border backdrop-blur">
            <Icon className="h-6 w-6 text-foreground/80" />
          </div>
          <Badge variant={typeMeta.badgeVariant} className="shadow-sm">
            {typeMeta.label}
          </Badge>
          {isDefault && (
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Default
            </Badge>
          )}
          {(project.metadata as any)?.wizardComplete && (
            <Badge className="gap-1 bg-foreground text-background hover:bg-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Setup
            </Badge>
          )}
        </div>
      </div>

      <CardHeader className="pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate text-lg">
              {project.name}
            </CardTitle>
            <CardDescription className="truncate">
              {project.description || "—"}
            </CardDescription>
          </div>

          {/* Pin */}
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPin}
                  aria-label={project.pinned ? "Unpin project" : "Pin project"}
                  className={cn(
                    "transition-colors",
                    project.pinned && "text-foreground"
                  )}
                >
                  {project.pinned ? (
                    <Pin className="h-4 w-4" />
                  ) : (
                    <PinOff className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{project.pinned ? "Unpin" : "Pin"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-4">
        {/* Meta stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-2 rounded-md border p-2">
            <Star className="h-4 w-4 text-yellow-500" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Stars</p>
              <p className="text-sm font-medium">{formatNumber(stats.stars)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-2">
            <GitFork className="h-4 w-4 text-emerald-600" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Forks</p>
              <p className="text-sm font-medium">{formatNumber(stats.forks)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-2">
            <Bug className="h-4 w-4 text-rose-600" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Issues</p>
              <p className="text-sm font-medium">{formatNumber(stats.issues)}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline" className="gap-1">
            <TimerReset className="h-3.5 w-3.5" />
            {relativeTime(project.updated_at)}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Code2 className="h-3.5 w-3.5" />
            {statusLabel}
          </Badge>

          {/* Languages */}
          <div className="flex flex-wrap items-center gap-2">
            {languages.slice(0, 3).map((l) => (
              <span
                key={l.name}
                className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs text-muted-foreground"
              >
                <span
                  className="mr-1 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: l.color ?? "#7c7c7c" }}
                  aria-hidden="true"
                />
                {l.name}
              </span>
            ))}
          </div>
        </div>

        <Separator />

        {/* Contributors and activity */}
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-2">
            <p className="mb-2 text-xs text-muted-foreground">
              Recent contributors
            </p>
            <Contributors names={contributors} />
          </div>
          <div className="col-span-3">
            <p className="mb-2 text-xs text-muted-foreground">
              Activity
            </p>
            <ActivitySparkline data={activity} />
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="w-full">
          <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {/* Primary: Open */}
            <Button asChild variant="default" className="w-full gap-2">
              <Link
                href={externalHref ? (externalHref as string) : "/agent-management"}
                target={externalHref ? "_blank" : undefined}
                aria-label={primaryCtaLabel}
              >
                {React.createElement(primaryCtaIcon, { className: "h-4 w-4" })}
                {primaryCtaLabel}
              </Link>
            </Button>

            {/* Secondary: Settings */}
            <Button asChild variant="outline" className="w-full gap-2">
              <Link href="/settings" aria-label="Settings">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </Button>

            {/* Tertiary: Default */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isDefault ? "default" : "outline"}
                    className="w-full gap-2"
                    onClick={onDefault}
                    aria-label={isDefault ? "This is your default project" : "Make default project"}
                  >
                    {isDefault ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
                    {isDefault ? "Default" : "Make default"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Default project used in quick actions</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Danger: Delete */}
            <TooltipProvider>
              <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-destructive hover:bg-destructive/10"
                    onClick={onDelete}
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete project</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
