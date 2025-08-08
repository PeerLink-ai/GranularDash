"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2, Rocket, Settings2 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Stepper } from "@/components/ui/stepper"
import { ModalHeader } from "@/components/ui/modal-header"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

const steps = ["Agent Details", "Configuration", "Confirmation"]

interface Props {
  isOpen: boolean
  onClose: (open: boolean) => void
  onDeployAgent: (name: string) => void
}

export function DeployAgentModal({ isOpen, onClose, onDeployAgent }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [agentName, setAgentName] = useState("")
  const [agentType, setAgentType] = useState("")
  const [policySet, setPolicySet] = useState("")
  const [resources, setResources] = useState("")
  const [notes, setNotes] = useState("")

  const canContinue = useMemo(() => {
    if (currentStep === 0) return agentName.trim().length >= 2 && !!agentType
    if (currentStep === 1) return !!policySet && resources.trim().length > 0
    return true
  }, [currentStep, agentName, agentType, policySet, resources])

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      onDeployAgent(agentName)
      onClose(false)
    }
  }

  const handleBack = () => setCurrentStep((s) => Math.max(0, s - 1))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <ModalHeader
          title="Deploy New Agent"
          description="Provide details and configuration to launch your AI agent"
          icon={Rocket}
          gradientFrom="from-violet-700"
          gradientTo="to-fuchsia-600"
        />

        <div className="px-4 sm:px-6 pt-4">
          <Stepper steps={steps} current={currentStep} />
        </div>

        <div className="px-4 sm:px-6 pb-4 pt-3 space-y-4">
          {currentStep === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  placeholder="e.g., AI-Finance-TradeBot"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="agentType">Agent Type</Label>
                <Select value={agentType} onValueChange={setAgentType}>
                  <SelectTrigger id="agentType">
                    <SelectValue placeholder="Select agent type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financial">Financial Trading</SelectItem>
                    <SelectItem value="supplychain">Supply Chain Optimization</SelectItem>
                    <SelectItem value="hr">HR Automation</SelectItem>
                    <SelectItem value="legal">Legal Discovery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="notes">Description (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="What will this agent do?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="policySet">Policy Set</Label>
                <Select value={policySet} onValueChange={setPolicySet}>
                  <SelectTrigger id="policySet">
                    <SelectValue placeholder="Select policy set" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard-compliance">Standard Compliance</SelectItem>
                    <SelectItem value="high-security">High Security & Audit</SelectItem>
                    <SelectItem value="experimental">Experimental (Reduced Governance)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resourceAllocation">Resource Allocation</Label>
                <Input
                  id="resourceAllocation"
                  placeholder="e.g., 2 Cores, 4GB RAM"
                  value={resources}
                  onChange={(e) => setResources(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Settings2 className="h-3.5 w-3.5" />
                <span>{"You can adjust these later from the agent's settings."}</span>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">Agent Deployment Initiated</p>
              <p className="text-sm text-muted-foreground">
                Agent "{agentName}" of type "{agentType}" will launch with "{policySet}" controls.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary">{resources || "Auto-resourced"}</Badge>
                {notes && <Badge variant="outline">Notes attached</Badge>}
              </div>
            </div>
          )}

          <div className="flex justify-between pt-1">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
              Back
            </Button>
            <Button onClick={handleContinue} disabled={!canContinue}>
              {currentStep === steps.length - 1 ? "Close" : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
