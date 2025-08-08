"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pin, PinOff, Settings, ExternalLink, FolderKanban, Star, StarOff, Trash2, Github } from 'lucide-react'
import type { Project } from "@/app/projects/page"

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
  const isGithub = project.type === "github"
  const externalHref =
    isGithub && project.repo_url
      ? project.repo_url
      : project.type === "external"
      ? project.repo_url ?? undefined
      : undefined

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base truncate">{project.name}</CardTitle>
              {project.type === "native" && <Badge>Native</Badge>}
              {project.type === "github" && (
                <Badge variant="secondary" className="gap-1">
                  <Github className="h-3.5 w-3.5" /> GitHub
                </Badge>
              )}
              {project.type === "external" && <Badge variant="outline">External</Badge>}
            </div>
            <CardDescription className="truncate">{project.description || "—"}</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onPin} aria-label={project.pinned ? "Unpin" : "Pin"}>
            {project.pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Link href={isGithub ? (externalHref as string) : project.type === "external" && externalHref ? externalHref : "/agent-management"} target={isGithub || project.type === "external" ? "_blank" : undefined} className="w-full">
            <Button variant="outline" className="w-full gap-2">
              {isGithub || project.type === "external" ? <ExternalLink className="h-4 w-4" /> : <FolderKanban className="h-4 w-4" />}
              {isGithub || project.type === "external" ? "Open" : "Open workspace"}
            </Button>
          </Link>
          <Link href="/settings" className="w-full">
            <Button variant="outline" className="w-full gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isDefault ? "default" : "outline"} className="gap-2" onClick={onDefault}>
            {isDefault ? <Star className="h-4 w-4" /> : <StarOff className="h-4 w-4" />}
            {isDefault ? "Default" : "Make default"}
          </Button>
          <Button variant="ghost" className="text-destructive gap-2" onClick={onDelete}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
