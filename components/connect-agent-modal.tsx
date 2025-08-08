"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ShieldCheck, AlertTriangle, PlugZap } from 'lucide-react'
import { ModalHeader } from "@/components/ui/modal-header"
import { Stepper } from "@/components/ui/stepper"

interface ConnectAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgentConnected: () => void
}

const steps = ["Details", "Connect"]

export function ConnectAgentModal({ open, onOpenChange, onAgentConnected }: ConnectAgentModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    endpoint: "",
    apiKey: "",
    description: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentStep, setCurrentStep] = useState(0)
  const { toast } = useToast()

  const isValidUrl = (url: string) => {
    try {
      const u = new URL(url)
      return u.protocol === "https:" || u.protocol === "http:"
    } catch {
      return false
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!formData.name || formData.name.trim().length < 2) e.name = "Name must be at least 2 characters."
    if (!formData.type) e.type = "Please select a provider."
    if (!formData.endpoint || !isValidUrl(formData.endpoint)) e.endpoint = "Provide a valid HTTP(S) URL."
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const canSubmit = useMemo(() => {
    return formData.name.trim().length >= 2 && !!formData.type && isValidUrl(formData.endpoint)
  }, [formData])

  const nextDisabled = currentStep === 0 ? !validate() && true : false

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validate()) return
      setCurrentStep(1)
    }
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!validate()) return
    setIsLoading(true)
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || "Failed to connect agent")
      }
      toast({
        title: "Agent Connected",
        description: data?.health?.reachable
          ? `Connected successfully in ${data.health.ms}ms`
          : "Connected, but endpoint reported an issue (see Audit Logs).",
      })
      setFormData({ name: "", type: "", endpoint: "", apiKey: "", description: "" })
      setErrors({})
      onAgentConnected()
      onOpenChange(false)
    } catch (err) {
      toast({
        title: "Connection Failed",
        description: err instanceof Error ? err.message : "Failed to connect agent",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden">
        <ModalHeader
          title="Connect New Agent"
          description="We’ll validate the endpoint, secure your API key, and log the event."
          icon={PlugZap}
          gradientFrom="from-fuchsia-700"
          gradientTo="to-pink-600"
        />
        <div className="px-4 sm:px-6 pt-4">
          <Stepper steps={steps} current={currentStep} />
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 pb-5 pt-3 space-y-4">
          {currentStep === 0 && (
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  placeholder="My AI Assistant"
                  value={formData.name}
                  onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Provider</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((s) => ({ ...s, type: value }))}
                >
                  <SelectTrigger id="type" aria-invalid={!!errors.type}>
                    <SelectValue placeholder="Select provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="custom">Custom API</SelectItem>
                    <SelectItem value="huggingface">Hugging Face</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">API Endpoint</Label>
                <Input
                  id="endpoint"
                  placeholder="https://api.openai.com/v1"
                  value={formData.endpoint}
                  onChange={(e) => setFormData((s) => ({ ...s, endpoint: e.target.value }))}
                  aria-invalid={!!errors.endpoint}
                />
                {errors.endpoint && <p className="text-sm text-destructive">{errors.endpoint}</p>}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{"We don't store raw API keys; they're encrypted at rest."}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key (Optional)</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="sk-..."
                  value={formData.apiKey}
                  onChange={(e) => setFormData((s) => ({ ...s, apiKey: e.target.value }))}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>If the endpoint requires auth, include a key to pass the reachability check.</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Model/Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="gpt-4 or a brief purpose of this agent..."
                  value={formData.description}
                  onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
                />
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                When you connect, we’ll ping the endpoint and add an entry to your audit log.
              </p>
            </div>
          )}

          <div className="flex justify-between pt-1">
            <Button
              type={currentStep === 1 ? "button" : "button"}
              variant="outline"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
            >
              Back
            </Button>

            {currentStep === 0 ? (
              <Button type="button" onClick={handleNext} disabled={nextDisabled}>
                Next
              </Button>
            ) : (
              <Button type="submit" disabled={!canSubmit || isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect Agent
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
