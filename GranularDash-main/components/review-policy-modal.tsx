"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const steps = ["Select Policy", "Review & Edit", "Confirmation"]

const dummyPolicies = [
  {
    id: "POL-001",
    name: "Data Privacy Policy",
    content:
      "Ensure all PII is encrypted and anonymized before processing. No data sharing with unauthorized third parties.",
  },
  {
    id: "POL-002",
    name: "Ethical AI Use Policy",
    content: "AI agents must not engage in discriminatory practices. Decisions must be explainable and auditable.",
  },
  {
    id: "POL-003",
    name: "Financial Transaction Policy",
    content:
      "All financial transactions over $10,000 require human oversight. Automated trades must adhere to risk limits.",
  },
]

export function ReviewPolicyModal({ isOpen, onClose, onReviewPolicy }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPolicyId, setSelectedPolicyId] = useState("")
  const [policyContent, setPolicyContent] = useState("")

  // Default to a no-op if onReviewPolicy or onClose is not provided
  const safeOnReviewPolicy = typeof onReviewPolicy === 'function' ? onReviewPolicy : () => {};
  const safeOnClose = typeof onClose === 'function' ? onClose : () => {};

  const handlePolicySelect = (value) => {
    setSelectedPolicyId(value)
    const policy = dummyPolicies.find((p) => p.id === value)
    if (policy) {
      setPolicyContent(policy.content)
    }
  }

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      safeOnReviewPolicy(selectedPolicyId)
      safeOnClose()
    }
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Label htmlFor="policy">Select Policy to Review</Label>
            <Select onValueChange={handlePolicySelect} value={selectedPolicyId}>
              <SelectTrigger id="policy">
                <SelectValue placeholder="Select a policy" />
              </SelectTrigger>
              <SelectContent>
                {dummyPolicies.map((policy) => (
                  <SelectItem key={policy.id} value={policy.id}>
                    {policy.name} ({policy.id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <Label htmlFor="policyContent">Policy Content</Label>
            <Textarea
              id="policyContent"
              value={policyContent}
              onChange={(e) => setPolicyContent(e.target.value)}
              rows={8}
              className="min-h-[150px]"
            />
            <p className="text-sm text-muted-foreground">Note: Changes here will require formal approval process.</p>
          </div>
        )
      case 2:
        return (
          <div className="text-center space-y-4">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <p className="text-lg font-medium">Policy Review Submitted</p>
            <p className="text-sm text-muted-foreground">
              Review for policy "{selectedPolicyId}" has been submitted for approval.
            </p>
          </div>
        )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={safeOnClose}>
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
            <Button onClick={handleContinue} className="ml-auto" disabled={currentStep === 1 && !policyContent}>
              {currentStep === steps.length - 1 ? "Close" : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
