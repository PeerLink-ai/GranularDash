"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Play, Pause, FileText, MoreHorizontal } from "lucide-react"
import { DeployAgentModal } from "./deploy-agent-modal"
import { PauseAgentModal } from "./pause-agent-modal"
import { ReviewPolicyModal } from "./review-policy-modal"

export function SystemHealthOverview() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDeployAgentModalOpen, setIsDeployAgentModalOpen] = useState(false)
  const [isPauseAgentModalOpen, setIsPauseAgentModalOpen] = useState(false)
  const [isReviewPolicyModalOpen, setIsReviewPolicyModalOpen] = useState(false)

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

  const totalActiveAgents = agents.filter(agent => agent.status === 'active').length
  const agentsWithAlerts = agents.filter(agent => agent.status === 'inactive').length
  const agentsInReview = agents.filter(agent => agent.connectionStatus === 'Failed').length

  const agentStatus = [
    { name: "Active Agents", count: totalActiveAgents, status: "Operational" },
    { name: "Agents with Alerts", count: agentsWithAlerts, status: "Warning" },
    { name: "Agents in Review", count: agentsInReview, status: "Critical" },
  ]

  const handleDeployAgent = (agentName) => {
    console.log(`Deploying agent: ${agentName}`)
    fetchAgents() // Refresh the list
  }

  const handlePauseAgent = (agentId) => {
    console.log(`Pausing agent: ${agentId}`)
    fetchAgents() // Refresh the list
  }

  const handleReviewPolicy = (policyId) => {
    console.log(`Reviewing policy: ${policyId}`)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Health Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading agent status...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {agentStatus.map((status) => (
            <div key={status.name} className="flex items-center space-x-4">
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">{status.name}</p>
                <p className="text-2xl font-bold">{status.count}</p>
                <p className={`text-xs ${
                  status.status === "Operational" ? "text-green-600" :
                  status.status === "Warning" ? "text-yellow-600" :
                  "text-red-600"
                }`}>
                  {status.status}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setIsDeployAgentModalOpen(true)} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Agent
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsPauseAgentModalOpen(true)}>
            <Pause className="mr-2 h-4 w-4" /> Pause Agent
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsReviewPolicyModalOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Review Policy
          </Button>
        </div>
      </CardContent>
      <DeployAgentModal isOpen={isDeployAgentModalOpen} onOpenChange={setIsDeployAgentModalOpen} onAgentAdded={fetchAgents} />
      <PauseAgentModal isOpen={isPauseAgentModalOpen} onOpenChange={setIsPauseAgentModalOpen} agents={agents} onAgentPaused={fetchAgents} />
      <ReviewPolicyModal isOpen={isReviewPolicyModalOpen} onOpenChange={setIsReviewPolicyModalOpen} />
    </Card>
  )
}
