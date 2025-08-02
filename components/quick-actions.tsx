"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bot, BarChart3, Shield, Users, FileText, TestTube, AlertTriangle } from "lucide-react"
import Link from "next/link"

export function QuickActions() {
  const { user } = useAuth()

  if (!user) return null

  const getActionsForRole = () => {
    const baseActions = [
      {
        title: "View Analytics",
        description: "Check AI performance metrics",
        icon: BarChart3,
        href: "/analytics",
        permission: "view_analytics",
      },
    ]

    const roleSpecificActions = {
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

    const actions = [...baseActions, ...(roleSpecificActions[user.role] || [])]
    return actions.filter((action) => user.permissions.includes(action.permission))
  }

  const availableActions = getActionsForRole()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks for your role as {user.role}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {availableActions.map((action) => {
            const Icon = action.icon
            return (
              <Link key={action.title} href={action.href}>
                <Button variant="outline" className="w-full justify-start h-auto p-4 bg-transparent">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{action.title}</div>
                      <div className="text-sm text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </Button>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
