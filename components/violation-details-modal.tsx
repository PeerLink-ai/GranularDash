"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, AlertTriangle, Shield } from 'lucide-react'
import { ModalHeader } from "@/components/ui/modal-header"
import { Badge } from "@/components/ui/badge"

const steps = ["Violation Details", "Action & Resolution", "Confirmation"]

interface Props {
  violation: {
    id: string
    policy: string
    agentId: string
    severity: "High" | "Medium" | "Low"
    date: string
  }
  isOpen: boolean
  onClose: (open: boolean) => void
  onResolveViolation: (id: string) => void
}

export function ViolationDetailsModal({ violation, isOpen, onClose, onResolveViolation }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const canContinue = useMemo(() => (currentStep === 1 ? resolutionNotes.trim().length > 0 : true), [currentStep, resolutionNotes])

  const tone = violation.severity === "High" ? ["from-rose-700", "to-red-600"] : violation.severity === "Medium" ? ["from-amber-600", "to-orange-500"] : ["from-sky-600", "to-cyan-500"]

  const handleContinue = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    } else {
      onResolveViolation(violation.id)
      onClose(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[720px] p-0 overflow-hidden">
        <ModalHeader
          title="Policy Violation"
          description="Review the incident and log a resolution"
          icon={AlertTriangle}
          gradientFrom={tone[0]}
          gradientTo={tone[1]}
        />
        <div className="px-4 sm:px-6 pb-4 pt-4 space-y-4">
          {currentStep === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Info label="Policy Violated" value={violation.policy} />
              <Info label="Agent ID" value={violation.agentId} />
              <div className="flex items-center gap-2">
                <Label>Severity</Label>
                <Severity severity={violation.severity} />
              </div>
              <Info label="Date Detected" value={violation.date} />
              <div className="sm:col-span-2">
                <Label>Description</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Agent {violation.agentId} attempted an action that violated the "{violation.policy}" policy. Further
                  investigation required.
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-3">
              <Label htmlFor="resolutionNotes">Resolution Notes</Label>
              <Textarea
                id="resolutionNotes"
                placeholder="Describe the actions taken to resolve this violation..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                rows={6}
              />
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => console.log("Initiating Agent Quarantine for", violation.agentId)}
              >
                <Shield className="mr-2 h-4 w-4" />
                Quarantine Agent
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
              <p className="text-lg font-medium">Violation Processed</p>
              <p className="text-sm text-muted-foreground">
                Violation for policy "{violation.policy}" by agent "{violation.agentId}" has been marked for resolution.
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

function Severity({ severity }: { severity: "High" | "Medium" | "Low" }) {
  const map = {
    High: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200",
    Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    Low: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  }
  return <Badge className={map[severity]}>{severity}</Badge>
}
