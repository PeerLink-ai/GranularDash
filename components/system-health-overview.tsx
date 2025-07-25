"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Play, Pause, FileText, MoreHorizontal } from "lucide-react"
import { DeployAgentModal } from "./deploy-agent-modal"
import { PauseAgentModal } from "./pause-agent-modal"
import { ReviewPolicyModal } from "./review-policy-modal"

const initialAgentStatus = [
  { name: "Active Agents", count: 750, status: "Operational" },
  { name: "Agents with Alerts", count: 12, status: "Warning" },
  { name: "Agents in Review", count: 3, status: "Critical" },
]

export function SystemHealthOverview() {
  const [agentStatus, setAgentStatus] = useState(initialAgentStatus)
  const [isDeployAgentModalOpen, setIsDeployAgentModalOpen] = useState(false)
  const [isPauseAgentModalOpen, setIsPauseAgentModalOpen] = useState(false)
  const [isReviewPolicyModalOpen, setIsReviewPolicyModalOpen] = useState(false)

  const totalActiveAgents = agentStatus.find((s) => s.name === "Active Agents")?.count || 0
  const agentsWithAlerts = agentStatus.find((s) => s.name === "Agents with Alerts")?.count || 0

  const handleDeployAgent = (agentName) => {
    console.log(`Deploying agent: ${agentName}`)
    setAgentStatus((prev) =>
      prev.map((item) => (item.name === "Active Agents" ? { ...item, count: item.count + 1 } : item)),
    )
  }

  const handlePauseAgent = (agentId) => {
    console.log(`Pausing agent: ${agentId}`)
    setAgentStatus((prev) =>
      prev.map((item) => (item.name === "Active Agents" ? { ...item, count: item.count - 1 } : item)),
    )
  }

  const handleReviewPolicy = (policyId) => {
    console.log(`Reviewing policy: ${policyId}`)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health Overview</CardTitle>
        <Play className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{totalActiveAgents}</div>
        <p className="text-xs text-muted-foreground">Total active AI agents</p>
        <div className="mt-4 space-y-2">
          {agentStatus.map((status) => (
            <div key={status.name} className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{status.name}</span>
              <span className="text-sm font-medium">{status.count}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm" onClick={() => setIsDeployAgentModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Deploy
          </Button>
          <Button size="sm" onClick={() => setIsPauseAgentModalOpen(true)}>
            <Pause className="mr-2 h-4 w-4" /> Pause
          </Button>
          <Button size="sm" onClick={() => setIsReviewPolicyModalOpen(true)}>
            <FileText className="mr-2 h-4 w-4" /> Review
          </Button>
          <Button size="sm" variant="outline">
            <MoreHorizontal className="mr-2 h-4 w-4" /> More
          </Button>
        </div>
      </CardContent>
      <DeployAgentModal
        isOpen={isDeployAgentModalOpen}
        onClose={() => setIsDeployAgentModalOpen(false)}
        onDeployAgent={handleDeployAgent}
      />
      <PauseAgentModal
        isOpen={isPauseAgentModalOpen}
        onClose={() => setIsPauseAgentModalOpen(false)}
        onPauseAgent={handlePauseAgent}
        activeAgents={agentStatus.find((s) => s.name === "Active Agents")?.count || 0}
      />
      <ReviewPolicyModal
        isOpen={isReviewPolicyModalOpen}
        onClose={() => setIsReviewPolicyModalOpen(false)}
        onReviewPolicy={handleReviewPolicy}
      />
    </Card>
  )
}
