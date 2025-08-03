"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Settings, BarChart2, Shield, Bot, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"

export function QuickActions() {
  const { user } = useAuth()

  if (!user) return null

  const actions = [
    {
      title: "Connect New Agent",
      description: "Integrate a new AI model from various providers.",
      icon: Plus,
      href: "/agent-management",
      permission: "manage_agents",
    },
    {
      title: "View Analytics",
      description: "Access detailed performance and usage metrics.",
      icon: BarChart2,
      href: "/analytics",
      permission: "view_analytics",
    },
    {
      title: "Manage Policies",
      description: "Define and enforce governance policies for AI agents.",
      icon: Shield,
      href: "/policies-rules",
      permission: "manage_policies",
    },
    {
      title: "Agent Settings",
      description: "Configure global settings for AI agent behavior.",
      icon: Settings,
      href: "/settings",
      permission: "manage_agents", // Assuming settings includes agent config
    },
  ]

  const filteredActions = actions.filter((action) => user.permissions.includes(action.permission))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Perform common tasks quickly.</CardDescription>
      </CardHeader>
      <CardContent>
        {filteredActions.length === 0 ? (
          <div className="text-center py-8">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No quick actions available</h3>
            <p className="text-muted-foreground mb-4">Your current role does not have permissions for quick actions.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.title} href={action.href}>
                  <Button variant="outline" className="h-auto w-full flex-col items-start p-4 text-left bg-transparent">
                    <div className="flex items-center space-x-2 mb-2">
                      <Icon className="h-5 w-5" />
                      <span className="font-semibold">{action.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <ArrowRight className="mt-2 h-4 w-4 self-end text-muted-foreground" />
                  </Button>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
