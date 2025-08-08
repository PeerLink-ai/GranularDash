"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { Textarea } from "@/components/ui/textarea"
import { Stepper } from "@/components/ui/stepper"
import { ModalHeader } from "@/components/ui/modal-header"

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

interface Props {
  isOpen: boolean
  onClose: (open: boolean) => void
  onReviewPolicy: (id: string) => void
}

export function ReviewPolicyModal({ isOpen, onClose, onReviewPolicy }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPolicyId, setSelectedPolicyId] = useState("")
  const [policyContent, setPolicyContent] = useState("")

  const selectedPolicy = dummyPolicies.find((p) => p.id === selectedPolicyId)

  const canContinue = useMemo(() => {
    if (currentStep === 0) return selectedPolicyId.length > 0
    if (currentStep === 1) return policyContent.trim().length > 0
    return true
  }, [currentStep, selectedPolicyId, policyContent])

  const handlePolicySelect = (value: string) => {
    setSelectedPolicyId(value)
    const policy = dummyPolicies.find((p) => p.id === value)
    if (policy) setPolicyContent(policy.content)
  }

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      onReviewPolicy(selectedPolicyId)
      onClose(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <ModalHeader
          title="Review Policy"
          description="Audit and propose changes to a governance policy"
          icon={ShieldCheck}
          gradientFrom="from-emerald-700"
          gradientTo="to-teal-600"
        />

        <div className="px-4 sm:px-6 pt-4">
          <Stepper steps={steps} current={currentStep} />
        </div>

        <div className="px-4 sm:px-6 pb-4 pt-3 space-y-4">
          {currentStep === 0 && (
            <div className="space-y-3">
              <Label htmlFor="policy">Select Policy</Label>
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
          )}

          {currentStep === 1 && (
            <div className="space-y-3">
              <Label htmlFor="policyContent">Policy Content</Label>
              <Textarea
                id="policyContent"
                value={policyContent}
                onChange={(e) => setPolicyContent(e.target.value)}
                rows={10}
                className="min-h-[180px]"
              />
              {selectedPolicy && (
                <p className="text-xs text-muted-foreground">
                  Editing: <span className="font-medium">{selectedPolicy.name}</span> • {selectedPolicy.id}
                </p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">Policy Review Submitted</p>
              <p className="text-sm text-muted-foreground">
                Review for policy "{selectedPolicyId}" has been submitted for approval.
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
