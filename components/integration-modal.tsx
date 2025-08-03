"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Brain, Bot, Zap, Code, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface ConnectAgentModalProps {
  isOpen: boolean
  onClose: () => void
}

const providers = [
  { name: "OpenAI", icon: Brain, models: ["gpt-4o", "gpt-3.5-turbo"] },
  { name: "Anthropic", icon: Bot, models: ["claude-3-opus", "claude-3-sonnet"] },
  { name: "Groq", icon: Zap, models: ["llama3-8b", "llama3-70b"] },
  { name: "Replit", icon: Code, models: ["replit-code-v1"] },
]

export function ConnectAgentModal({ isOpen, onClose }: ConnectAgentModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedProvider, setSelectedProvider] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [agentName, setAgentName] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be signed in to connect an agent.",
        variant: "destructive",
      })
      return
    }
    if (!selectedProvider || !selectedModel || !agentName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    try {
      // Simulate OAuth connection
      const oauthResponse = await fetch(`/api/integrations/${selectedProvider.toLowerCase()}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id, // Pass user ID for server-side handling
        },
        body: JSON.stringify({
          redirectUri: `${window.location.origin}/api/integrations/${selectedProvider.toLowerCase()}/callback`,
        }),
      })

      if (!oauthResponse.ok) {
        throw new Error("OAuth simulation failed.")
      }

      const oauthData = await oauthResponse.json()
      // In a real app, this would redirect to the OAuth provider
      // For this demo, we directly call the callback route
      const callbackResponse = await fetch(oauthData.redirectUrl, {
        method: "GET", // Or POST, depending on OAuth flow
        headers: {
          "X-User-ID": user.id,
        },
      })

      if (!callbackResponse.ok) {
        throw new Error("OAuth callback simulation failed.")
      }

      // Now, register the agent in our system
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": user.id, // Pass user ID for server-side handling
        },
        body: JSON.stringify({
          name: agentName,
          provider: selectedProvider,
          model: selectedModel,
          endpoint: `https://api.${selectedProvider.toLowerCase()}.com/v1/chat/completions`, // Mock endpoint
        }),
      })

      if (response.ok) {
        toast({
          title: "Agent Connected!",
          description: `${agentName} from ${selectedProvider} is now connected.`,
        })
        onClose()
        // Trigger a refresh of the agent list in AgentList component
        window.dispatchEvent(new CustomEvent("agentConnected"))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to connect agent.")
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const selectedProviderData = providers.find((p) => p.name === selectedProvider)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect New AI Agent</DialogTitle>
          <DialogDescription>Select an AI provider and model to connect to your dashboard.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider" className="text-right">
              Provider
            </Label>
            <Select onValueChange={setSelectedProvider} value={selectedProvider}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((provider) => {
                  const Icon = provider.icon
                  return (
                    <SelectItem key={provider.name} value={provider.name}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {provider.name}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          {selectedProvider && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right">
                Model
              </Label>
              <Select onValueChange={setSelectedModel} value={selectedModel}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProviderData?.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="agent-name" className="text-right">
              Agent Name
            </Label>
            <Input
              id="agent-name"
              placeholder="e.g., My Custom GPT"
              className="col-span-3"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              "Connect Agent"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
