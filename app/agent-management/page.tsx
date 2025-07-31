"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AgentList } from "@/components/agent-list"

export default function AgentManagementPage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
        <Button onClick={() => setIsConnectModalOpen(true)}>Connect New Agent</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <AgentList isConnectModalOpen={isConnectModalOpen} onOpenChange={setIsConnectModalOpen} />
      </div>
    </div>
  )
}
