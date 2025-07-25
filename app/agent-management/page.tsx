"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConnectAgentModal } from "@/components/connect-agent-modal"
import { AgentList } from "@/components/agent-list"

export default function AgentManagementPage() {
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false)
  const [connectedExternalAgents, setConnectedExternalAgents] = useState([])

  const handleConnectAgent = (agentDetails) => {
    setConnectedExternalAgents((prevAgents) => [...prevAgents, { ...agentDetails, id: `EXT-${Date.now()}` }])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
        <Button onClick={() => setIsConnectModalOpen(true)}>Connect New Agent</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <AgentList />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected External AI Agents</CardTitle>
        </CardHeader>
        <CardContent>
          {connectedExternalAgents.length > 0 ? (
            <ul className="list-disc pl-5 space-y-2">
              {connectedExternalAgents.map((agent) => (
                <li key={agent.id}>
                  <strong>{agent.agentName}</strong> ({agent.agentType}) - Endpoint: {agent.endpointUrl}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">
              No external agents connected yet. Click "Connect New Agent" to add one.
            </p>
          )}
        </CardContent>
      </Card>

      <ConnectAgentModal
        isOpen={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        onConnectAgent={handleConnectAgent}
      />
    </div>
  )
}
