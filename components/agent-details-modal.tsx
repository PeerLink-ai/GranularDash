"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Brain, Bot, Zap, Code } from "lucide-react"
import type { Agent } from "@/contexts/auth-context" // Import Agent type

interface AgentDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  agent: Agent | null
}

const providerIcons = {
  OpenAI: Brain,
  Anthropic: Bot,
  Groq: Zap,
  Replit: Code,
}

export function AgentDetailsModal({ isOpen, onClose, agent }: AgentDetailsModalProps) {
  if (!agent) return null

  const Icon = providerIcons[agent.provider as keyof typeof providerIcons] || Bot

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-6 w-6" />
            {agent.name}
          </DialogTitle>
          <DialogDescription>Details and metrics for this AI agent.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-2">
            <Label>Provider:</Label>
            <span className="font-medium">{agent.provider}</span>

            <Label>Model:</Label>
            <span className="font-medium">{agent.model}</span>

            <Label>Status:</Label>
            <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>

            <Label>Endpoint:</Label>
            <span className="break-all text-sm">{agent.endpoint}</span>

            <Label>Connected At:</Label>
            <span className="text-sm">{new Date(agent.connectedAt).toLocaleString()}</span>

            <Label>Last Active:</Label>
            <span className="text-sm">{agent.lastActive}</span>
          </div>

          <h3 className="text-lg font-semibold mt-4">Usage Metrics</h3>
          <div className="grid grid-cols-2 gap-2">
            <Label>Total Requests:</Label>
            <span className="font-medium">{agent.usage.requests.toLocaleString()}</span>

            <Label>Tokens Used:</Label>
            <span className="font-medium">{agent.usage.tokensUsed.toLocaleString()}</span>

            <Label>Estimated Cost:</Label>
            <span className="font-medium">${agent.usage.estimatedCost.toFixed(2)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
