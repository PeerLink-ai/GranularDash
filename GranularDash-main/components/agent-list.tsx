"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ConnectAgentModal } from "./connect-agent-modal"
import { ViewAgentModal } from "./view-agent-modal"

export function AgentList({ isConnectModalOpen, onOpenChange }) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents/list')
      const data = await response.json()
      setAgents(data.agents || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
      setAgents([])
    } finally {
      setLoading(false)
    }
  }

  const handleControlAgent = async (agentId, action) => {
    try {
      const response = await fetch('/api/agents/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, action })
      })
      const result = await response.json()
      if (result.success) {
        fetchAgents() // Refresh the list
      }
    } catch (error) {
      console.error('Error controlling agent:', error)
    }
  }

  const handleDeleteAgent = async (agentId) => {
    if (confirm('Are you sure you want to delete this agent?')) {
      try {
        const response = await fetch(`/api/agents/delete?agentId=${agentId}`, {
          method: 'DELETE'
        })
        const result = await response.json()
        if (result.success) {
          fetchAgents() // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting agent:', error)
      }
    }
  }

  const handleViewAgent = (agent) => {
    setSelectedAgent(agent)
    setIsViewModalOpen(true)
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading agents...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Agents ({agents.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No agents connected yet. Click "Connect New Agent" to add your first agent.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent Name</TableHead>
                <TableHead>Agent ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Connected</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.agentId}>
                  <TableCell className="font-medium">{agent.agentName}</TableCell>
                  <TableCell className="font-mono text-sm">{agent.agentId}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{agent.agentType || 'custom'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      agent.status === 'active' ? 'bg-green-100 text-green-800' :
                      agent.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {agent.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTimestamp(agent.lastConnected)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => handleViewAgent(agent)}>
                        View
                      </Button>
                      {agent.status === 'active' ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleControlAgent(agent.agentId, 'deactivate')}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleControlAgent(agent.agentId, 'activate')}
                        >
                          Activate
                        </Button>
                      )}
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteAgent(agent.agentId)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <ConnectAgentModal isOpen={isConnectModalOpen} onOpenChange={onOpenChange} onAgentAdded={fetchAgents} />
      <ViewAgentModal isOpen={isViewModalOpen} onOpenChange={setIsViewModalOpen} agent={selectedAgent} />
    </Card>
  )
}
