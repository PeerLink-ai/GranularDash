"use client"

import type React from "react"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, BarChart3, Shield, Users, FileText, TestTube, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

type Permission = string
type RoleName = "admin" | "developer" | "analyst" | "viewer"

type ActionItem = {
  title: string
  description: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  permission: Permission
}

const BASE_ACTIONS: ActionItem[] = [
  {
    title: "View Analytics",
    description: "Check AI performance metrics",
    icon: BarChart3,
    href: "/analytics",
    permission: "view_analytics",
  },
]

const ROLE_ACTIONS: Record<RoleName, ActionItem[]> = {
  admin: [
    {
      title: "Manage Agents",
      description: "Connect and configure AI agents",
      icon: Bot,
      href: "/agent-management",
      permission: "manage_agents",
    },
    {
      title: "User Management",
      description: "Manage users and permissions",
      icon: Users,
      href: "/users-roles",
      permission: "manage_users",
    },
    {
      title: "Security Policies",
      description: "Configure governance rules",
      icon: Shield,
      href: "/policies-rules",
      permission: "manage_policies",
    },
    {
      title: "Audit Logs",
      description: "Review system activity",
      icon: FileText,
      href: "/audit-logs",
      permission: "view_audit_logs",
    },
  ],
  developer: [
    {
      title: "Manage Agents",
      description: "Connect and test AI agents",
      icon: Bot,
      href: "/agent-management",
      permission: "manage_agents",
    },
    {
      title: "Test Agents",
      description: "Run agent performance tests",
      icon: TestTube,
      href: "/training-simulation",
      permission: "test_agents",
    },
    {
      title: "Data Lineage",
      description: "Track model dependencies",
      icon: FileText,
      href: "/data-model-lineage",
      permission: "view_analytics",
    },
  ],
  analyst: [
    {
      title: "View Reports",
      description: "Access compliance reports",
      icon: FileText,
      href: "/compliance-reports",
      permission: "view_reports",
    },
    {
      title: "Risk Analysis",
      description: "Review risk assessments",
      icon: AlertTriangle,
      href: "/risk-management",
      permission: "view_reports",
    },
  ],
  viewer: [
    {
      title: "System Status",
      description: "Check system health",
      icon: Shield,
      href: "/",
      permission: "view_dashboard",
    },
  ],
}

/**
 * Safely compute available actions for a role given a permissions list.
 * Guards against undefined/null permissions to avoid `.includes` errors.
 */
function getActionsForRole(role: RoleName, permissionsInput: unknown): ActionItem[] {
  const permissions: Permission[] = Array.isArray(permissionsInput)
    ? permissionsInput.filter((p): p is string => typeof p === "string")
    : []

  const perms = new Set<Permission>(permissions)
  const roleActions = ROLE_ACTIONS[role] ?? []
  const all = [...BASE_ACTIONS, ...roleActions]
  return all.filter((action) => perms.has(action.permission))
}

export function QuickActions() {
  const { user } = useAuth()

  const role: RoleName = (user.role as RoleName) ?? "viewer"
  const permissionsSafe = Array.isArray((user as any)?.permissions) ? (user as any).permissions : []

  const availableActions = useMemo(() => getActionsForRole(role, permissionsSafe), [role, permissionsSafe])

  // If there's no authenticated user, don't render the card
  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>{`Common tasks for your role${role ? ` as ${role}` : ""}`}</CardDescription>
      </CardHeader>
      <CardContent>
        {availableActions.length === 0 ? (
          <div className="text-sm text-muted-foreground">No quick actions available with your current permissions.</div>
        ) : (
          <div className="grid gap-3">
            {availableActions.map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={`${action.title}-${action.href}`}
                  variant="outline"
                  className="w-full justify-start h-auto p-4 bg-transparent"
                  asChild
                >
                  <Link href={action.href} aria-label={action.title}>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{action.title}</div>
                        <div className="text-sm text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
