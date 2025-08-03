"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { AgentList } from "@/components/agent-list"
import { IntegrationModal } from "@/components/integration-modal"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Shield } from "lucide-react"

export default function AgentManagementPage() {
  const { user } = useAuth()
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false)

  if (!user) return null

  const hasPermission = user.permissions.includes("manage_agents")

  if (!hasPermission) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Access Restricted</span>
            </CardTitle>
            <CardDescription>You don't have permission to manage AI agents.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Contact your administrator to request agent management permissions.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
          <p className="text-muted-foreground">Connect and manage your AI agents with seamless OAuth integration</p>
        </div>
        <Button onClick={() => setIsIntegrationModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Connect New Agent
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <AgentList />
      </div>

      <IntegrationModal isOpen={isIntegrationModalOpen} onOpenChange={setIsIntegrationModalOpen} />
    </div>
  )
}
