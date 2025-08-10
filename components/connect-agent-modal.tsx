"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Activity, Loader2, Lock, ScrollText, ShieldCheck } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface ConnectAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgentConnected: () => void
}

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
    return !isLoading && formData.name.trim().length >= 2 && !!formData.type && isValidUrl(formData.endpoint)
  }, [formData, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      // Reset form
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
      <DialogContent className="sm:max-w-[760px]">
        <DialogHeader className="space-y-1.5">
          <DialogTitle className="text-xl">Connect New Agent</DialogTitle>
          <DialogDescription>
            {"We’ll validate the endpoint, check reachability, secure your API key, and log the event for audit."}
          </DialogDescription>
        </DialogHeader>

        {/* Intro badges / highlights */}
        <div className="grid gap-3 sm:grid-cols-3">
          <FeatureTile
            icon={Lock}
            title="Encrypted key storage"
            description="API keys are encrypted at rest."
            className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-900"
          />
          <FeatureTile
            icon={Activity}
            title="Live endpoint check"
            description="We ping your endpoint during setup."
            className="bg-amber-50/60 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-900"
          />
          <FeatureTile
            icon={ScrollText}
            title="Audit log entry"
            description="A detailed audit trail is recorded."
            className="bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
          />
        </div>

        <Separator />

        {/* Two-column layout on larger screens */}
        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-3 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                placeholder="My AI Assistant"
                value={formData.name}
                onChange={(e) => setFormData((s) => ({ ...s, name: e.target.value }))}
                aria-invalid={!!errors.name}
                disabled={isLoading}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Use something recognizable to your team.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Provider</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((s) => ({ ...s, type: value }))}
                disabled={isLoading}
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
                disabled={isLoading}
              />
              {errors.endpoint ? (
                <p className="text-sm text-destructive">{errors.endpoint}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Must be a valid HTTP(S) URL.</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="apiKey">API Key (Optional)</Label>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {"Encrypted at rest"}
                </span>
              </div>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={formData.apiKey}
                onChange={(e) => setFormData((s) => ({ ...s, apiKey: e.target.value }))}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                If the endpoint requires auth, include a key to pass the reachability check.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="gpt-4 or a brief purpose of this agent..."
                value={formData.description}
                onChange={(e) => setFormData((s) => ({ ...s, description: e.target.value }))}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">Add the model name or short purpose to help teammates.</p>
            </div>
          </div>

          <div className="md:col-span-5 flex items-center justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Connecting Agent..." : "Connect Agent"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FeatureTile({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  className?: string
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-md border p-3", className)} aria-label={title}>
      <div className="mt-0.5 rounded-md bg-background/80 p-1.5 ring-1 ring-border">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
