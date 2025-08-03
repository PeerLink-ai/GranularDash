"use client"

import { AgentList } from "@/components/agent-list"
import { ConnectAgentModal } from "@/components/connect-agent-modal"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"

export default function AgentManagementPage() {
  const { user } = useAuth()
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please sign in to view this page.</p>
      </div>
    )
  }

  const canManageAgents = user.permissions.includes("manage_agents")

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
        {canManageAgents && (
          <Button onClick={() => setIsConnectModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Connect New Agent
          </Button>
        )}
      </div>
      <AgentList />
      {canManageAgents && (
        <ConnectAgentModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} />
      )}
    </div>
  )
}
