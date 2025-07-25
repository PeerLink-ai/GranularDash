"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const steps = ["Agent Details", "Configuration", "Confirmation"]

export function DeployAgentModal({ isOpen, onClose, onDeployAgent }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [agentName, setAgentName] = useState("")
  const [agentType, setAgentType] = useState("")
  const [policySet, setPolicySet] = useState("")

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onDeployAgent(agentName)
      onClose()
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Label htmlFor="agentName">Agent Name</Label>
            <Input
              id="agentName"
              placeholder="e.g., AI-Finance-TradeBot"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
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
        )
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="policySet">Select Policy Set</Label>
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
            <Label htmlFor="resourceAllocation">Resource Allocation (CPU/Memory)</Label>
            <Input id="resourceAllocation" placeholder="e.g., 2 Cores, 4GB RAM" />
          </div>
        )
      case 2:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Agent Deployment Initiated</p>
            <p className="text-sm text-muted-foreground">
              Agent "{agentName}" of type "{agentType}" is being deployed with policy set "{policySet}".
            </p>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{steps[currentStep]}</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          {renderStepContent()}
          <div className="flex justify-between">
            {currentStep > 0 && currentStep < steps.length - 1 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleContinue} className="ml-auto">
              {currentStep === steps.length - 1 ? "Close" : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
