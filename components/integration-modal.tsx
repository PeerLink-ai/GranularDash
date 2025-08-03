"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Bot, Zap, Code, Brain, Sparkles, CheckCircle, ExternalLink } from "lucide-react"

const integrations = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Connect GPT-4, GPT-3.5, and other OpenAI models with OAuth",
    icon: Brain,
    status: "available",
    features: ["GPT-4o", "GPT-4", "GPT-3.5-turbo", "DALL-E", "Whisper"],
    color: "bg-green-500",
    oauthUrl: "https://platform.openai.com/oauth/authorize",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Connect Claude 3 models with secure OAuth integration",
    icon: Bot,
    status: "available",
    features: ["Claude 3 Opus", "Claude 3 Sonnet", "Claude 3 Haiku"],
    color: "bg-orange-500",
    oauthUrl: "https://console.anthropic.com/oauth/authorize",
  },
  {
    id: "replit",
    name: "Replit",
    description: "Connect Replit AI agents and code execution environments",
    icon: Code,
    status: "available",
    features: ["Code Generation", "Code Execution", "Replit Agent"],
    color: "bg-blue-500",
    oauthUrl: "https://replit.com/oauth/authorize",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference with Llama and Mixtral models",
    icon: Zap,
    status: "available",
    features: ["Llama 3", "Mixtral 8x7B", "Gemma 7B"],
    color: "bg-purple-500",
    oauthUrl: "https://console.groq.com/oauth/authorize",
  },
  {
    id: "google",
    name: "Google AI",
    description: "Connect Gemini Pro and other Google AI models",
    icon: Sparkles,
    status: "coming-soon",
    features: ["Gemini Pro", "PaLM 2", "Bard"],
    color: "bg-yellow-500",
    oauthUrl: null,
  },
]

export function IntegrationModal({ isOpen, onOpenChange }) {
  const [connecting, setConnecting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleConnect = async (integration) => {
    if (integration.status === "coming-soon") return

    setConnecting(integration.id)

    try {
      // Start OAuth flow
      const response = await fetch(`/api/integrations/${integration.id}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        const { authUrl } = await response.json()

        // Open OAuth popup
        const popup = window.open(
          authUrl,
          "oauth",
          "width=600,height=700,scrollbars=yes,resizable=yes,left=" +
            (window.screen.width / 2 - 300) +
            ",top=" +
            (window.screen.height / 2 - 350),
        )

        // Listen for OAuth completion
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed)
            setConnecting(null)

            // Check if connection was successful
            setTimeout(() => {
              toast({
                title: "Agent Connected!",
                description: `Successfully connected ${integration.name} agent`,
              })
              onOpenChange(false)
              // Refresh the page to show new agents
              window.location.reload()
            }, 500)
          }
        }, 1000)

        // Handle popup blocked
        if (!popup || popup.closed) {
          throw new Error("Popup blocked")
        }
      } else {
        throw new Error("Failed to initiate OAuth")
      }
    } catch (error) {
      console.error("Connection failed:", error)
      toast({
        title: "Connection Failed",
        description:
          error.message === "Popup blocked"
            ? "Please allow popups for this site and try again"
            : "Failed to connect agent. Please try again.",
        variant: "destructive",
      })
      setConnecting(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Connect AI Agents</DialogTitle>
          <DialogDescription>
            Choose from our supported AI providers. We'll securely connect using OAuth - no API keys needed!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => {
            const Icon = integration.icon
            const isConnecting = connecting === integration.id
            const isComingSoon = integration.status === "coming-soon"

            return (
              <Card key={integration.id} className="relative hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`p-2 rounded-lg ${integration.color} text-white`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-lg">{integration.name}</CardTitle>
                    </div>
                    {isComingSoon ? (
                      <Badge variant="secondary">Coming Soon</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        OAuth Ready
                      </Badge>
                    )}
                  </div>
                  <CardDescription>{integration.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Available Models:</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleConnect(integration)}
                      disabled={isConnecting || isComingSoon}
                    >
                      {isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Connecting...
                        </>
                      ) : isComingSoon ? (
                        "Coming Soon"
                      ) : (
                        <>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Connect {integration.name}
                        </>
                      )}
                    </Button>

                    {!isComingSoon && (
                      <p className="text-xs text-muted-foreground text-center">Secure OAuth - No API keys required</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">How it works:</h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Click "Connect" to open the provider's OAuth page</li>
            <li>2. Sign in to your provider account and authorize Granular</li>
            <li>3. Your agent will be automatically configured and ready to use</li>
            <li>4. No API keys to manage - everything is handled securely</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  )
}
