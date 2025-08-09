"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"

const steps = ["Select Agent", "Confirmation"]

export function PauseAgentModal({ isOpen, onClose, onPauseAgent, activeAgents }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAgentId, setSelectedAgentId] = useState("")

  const dummyAgents = Array.from({ length: activeAgents }, (_, i) => ({
    id: `AI-Agent-${String(i + 1).padStart(3, "0")}`,
    name: `Agent ${String(i + 1).padStart(3, "0")}`,
  }))

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onPauseAgent(selectedAgentId)
      onClose()
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Label htmlFor="agentId">Select Agent to Pause</Label>
            <Select onValueChange={setSelectedAgentId} value={selectedAgentId}>
              <SelectTrigger id="agentId">
                <SelectValue placeholder="Select an active agent" />
              </SelectTrigger>
              <SelectContent>
                {dummyAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name} ({agent.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 1:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Agent Pause Initiated</p>
            <p className="text-sm text-muted-foreground">
              Agent "{selectedAgentId}" has been sent a pause command. Monitoring will continue.
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
