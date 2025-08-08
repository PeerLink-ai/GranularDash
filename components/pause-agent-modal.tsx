"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, PauseCircle } from 'lucide-react'
import { Stepper } from "@/components/ui/stepper"
import { ModalHeader } from "@/components/ui/modal-header"

const steps = ["Select Agent", "Confirmation"]

interface Props {
  isOpen: boolean
  onClose: (open: boolean) => void
  onPauseAgent: (agentId: string) => void
  activeAgents?: number
}

export function PauseAgentModal({ isOpen, onClose, onPauseAgent, activeAgents = 3 }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedAgentId, setSelectedAgentId] = useState("")

  const dummyAgents = useMemo(
    () =>
      Array.from({ length: activeAgents }, (_, i) => ({
        id: `AI-Agent-${String(i + 1).padStart(3, "0")}`,
        name: `Agent ${String(i + 1).padStart(3, "0")}`,
      })),
    [activeAgents]
  )

  const canContinue = currentStep === 0 ? selectedAgentId.length > 0 : true

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      onPauseAgent(selectedAgentId)
      onClose(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <ModalHeader
          title="Pause Agent"
          description="Send a pause signal to a running agent. Resume anytime."
          icon={PauseCircle}
          gradientFrom="from-amber-600"
          gradientTo="to-orange-500"
        />
        <div className="px-4 sm:px-6 pt-4">
          <Stepper steps={steps} current={currentStep} />
        </div>

        <div className="px-4 sm:px-6 pb-4 pt-3 space-y-4">
          {currentStep === 0 && (
            <div className="space-y-3">
              <Label htmlFor="agentId">Select Agent</Label>
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
          )}

          {currentStep === 1 && (
            <div className="text-center space-y-4 py-2">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">Pause Command Sent</p>
              <p className="text-sm text-muted-foreground">
                Agent "{selectedAgentId}" has been sent a pause command. Monitoring continues.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-1">
            <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}>
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
