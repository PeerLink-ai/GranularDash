"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2 } from "lucide-react"

const steps = ["Violation Details", "Action & Resolution", "Confirmation"]

export function ViolationDetailsModal({ violation, isOpen, onClose, onResolveViolation }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [resolutionNotes, setResolutionNotes] = useState("")

  if (!violation) return null

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      onResolveViolation?.(violation.id)
      onClose?.()
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <div>
              <Label>Policy Violated</Label>
              <p className="text-sm font-medium">{violation.policy || 'Unknown'}</p>
            </div>
            <div>
              <Label>Agent ID</Label>
              <p className="text-sm font-medium">{violation.agentId || 'Unknown'}</p>
            </div>
            <div>
              <Label>Severity</Label>
              <p
                className={`text-sm font-medium ${violation.severity === "High" ? "text-red-500" : violation.severity === "Medium" ? "text-yellow-500" : "text-blue-500"}`}
              >
                {violation.severity || 'Unknown'}
              </p>
            </div>
            <div>
              <Label>Date Detected</Label>
              <p className="text-sm font-medium">{violation.date ? new Date(violation.date).toLocaleString() : 'Unknown'}</p>
            </div>
            <div>
              <Label>Description</Label>
              <p className="text-sm text-muted-foreground">
                Agent {violation.agentId || 'Unknown'} attempted an action that violated the "{violation.policy || 'Unknown'}" policy. Further
                investigation required.
              </p>
            </div>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="resolutionNotes">Resolution Notes</Label>
            <Textarea
              id="resolutionNotes"
              placeholder="Describe the actions taken to resolve this violation..."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              rows={6}
            />
            <Button
              className="w-full"
              onClick={() => console.log("Initiating Agent Quarantine for", violation.agentId)}
            >
              Quarantine Agent
            </Button>
          </div>
        )
      case 2:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Violation Processed</p>
            <p className="text-sm text-muted-foreground">
              Violation for policy "{violation.policy || 'Unknown'}" by agent "{violation.agentId || 'Unknown'}" has been marked for resolution.
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
