"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bot, ExternalLink, Key, X, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface IntegrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAgentConnected?: () => void
}

const AGENT_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Connect GPT-4, GPT-3.5, and other OpenAI models",
    logo: "🤖",
    category: "LLM",
    difficulty: "Easy",
    setupTime: "2 min",
    features: ["Text Generation", "Code Completion", "Chat", "Embeddings"],
    authType: "API Key",
    docUrl: "https://platform.openai.com/docs",
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Connect Claude 3 and other Anthropic models",
    logo: "🧠",
    category: "LLM",
    difficulty: "Easy",
    setupTime: "2 min",
    features: ["Text Generation", "Analysis", "Reasoning", "Safety"],
    authType: "API Key",
    docUrl: "https://docs.anthropic.com",
  },
  {
    id: "replit",
    name: "Replit Agent",
    description: "Connect Replit's code generation agents",
    logo: "💻",
    category: "Code",
    difficulty: "Medium",
    setupTime: "5 min",
    features: ["Code Generation", "Debugging", "Deployment", "Collaboration"],
    authType: "OAuth",
    docUrl: "https://docs.replit.com/agents",
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference with Groq's LPU technology",
    logo: "⚡",
    category: "LLM",
    difficulty: "Easy",
    setupTime: "2 min",
    features: ["Fast Inference", "Llama Models", "Mixtral", "Real-time"],
    authType: "API Key",
    docUrl: "https://console.groq.com/docs",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    description: "Access thousands of open-source models",
    logo: "🤗",
    category: "ML Platform",
    difficulty: "Medium",
    setupTime: "3 min",
    features: ["Open Source Models", "Custom Models", "Inference API", "Datasets"],
    authType: "API Key",
    docUrl: "https://huggingface.co/docs",
  },
  {
    id: "cohere",
    name: "Cohere",
    description: "Enterprise-grade language models",
    logo: "🔮",
    category: "LLM",
    difficulty: "Easy",
    setupTime: "2 min",
    features: ["Text Generation", "Embeddings", "Classification", "Summarization"],
    authType: "API Key",
    docUrl: "https://docs.cohere.com",
  },
]

export function IntegrationModal({ isOpen, onOpenChange, onAgentConnected }: IntegrationModalProps) {
  const { user } = useAuth()
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [connectionStep, setConnectionStep] = useState<"select" | "configure" | "test" | "success">("select")
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionData, setConnectionData] = useState({
    name: "",
    apiKey: "",
    endpoint: "",
    model: "",
    description: "",
  })
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const selectedProviderData = AGENT_PROVIDERS.find((p) => p.id === selectedProvider)

  const handleClose = () => {
    setSelectedProvider(null)
    setConnectionStep("select")
    setConnectionData({ name: "", apiKey: "", endpoint: "", model: "", description: "" })
    setTestResult(null)
    onOpenChange(false)
  }

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId)
    setConnectionStep("configure")
    const provider = AGENT_PROVIDERS.find((p) => p.id === providerId)
    if (provider) {
      setConnectionData((prev) => ({
        ...prev,
        name: `${user?.organization} ${provider.name} Agent`,
        model: getDefaultModel(providerId),
      }))
    }
  }

  const getDefaultModel = (providerId: string) => {
    const defaults = {
      openai: "gpt-4",
      anthropic: "claude-3-sonnet-20240229",
      groq: "llama3-70b-8192",
      cohere: "command-r-plus",
      huggingface: "microsoft/DialoGPT-medium",
    }
    return defaults[providerId] || ""
  }

  const handleOAuthConnect = async (providerId: string) => {
    try {
      setIsConnecting(true)
      const response = await fetch(`/api/integrations/${providerId}/connect`, {
        method: "POST",
      })

      if (response.ok) {
        const { authUrl } = await response.json()
        window.open(authUrl, "_blank", "width=600,height=700")
        toast.success("OAuth window opened. Please complete authentication.")
      } else {
        throw new Error("Failed to initiate OAuth")
      }
    } catch (error) {
      toast.error("Failed to connect via OAuth")
    } finally {
      setIsConnecting(false)
    }
  }

  const handleTestConnection = async () => {
    if (!selectedProviderData) return

    setIsConnecting(true)
    try {
      // Simulate API test
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const success = Math.random() > 0.2 // 80% success rate for demo
      setTestResult({
        success,
        message: success
          ? "Connection successful! Agent is ready to use."
          : "Connection failed. Please check your API key and try again.",
      })

      if (success) {
        setTimeout(() => setConnectionStep("success"), 1000)
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Connection test failed. Please try again.",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSaveAgent = async () => {
    if (!selectedProviderData || !user) return

    setIsConnecting(true)
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: connectionData.name,
          provider: selectedProvider,
          model: connectionData.model,
          endpoint: connectionData.endpoint || `https://api.${selectedProvider}.com/v1`,
          apiKey: connectionData.apiKey,
          description: connectionData.description,
          organization: user.organization,
        }),
      })

      if (response.ok) {
        toast.success("Agent connected successfully!")
        onAgentConnected?.()
        handleClose()
      } else {
        throw new Error("Failed to save agent")
      }
    } catch (error) {
      toast.error("Failed to save agent")
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Connect New Agent
            </DialogTitle>
            <DialogDescription>
              Connect AI agents to your {user?.organization} organization for automated governance and monitoring.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {connectionStep === "select" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {AGENT_PROVIDERS.map((provider) => (
                <Card
                  key={provider.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleProviderSelect(provider.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{provider.logo}</span>
                        <CardTitle className="text-lg">{provider.name}</CardTitle>
                      </div>
                      <Badge variant="secondary">{provider.category}</Badge>
                    </div>
                    <CardDescription className="text-sm">{provider.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Setup:</span>
                        <span className="font-medium">{provider.setupTime}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Difficulty:</span>
                        <Badge variant={provider.difficulty === "Easy" ? "default" : "secondary"} className="text-xs">
                          {provider.difficulty}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {provider.features.slice(0, 2).map((feature) => (
                          <Badge key={feature} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                        {provider.features.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{provider.features.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {connectionStep === "configure" && selectedProviderData && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <span className="text-2xl">{selectedProviderData.logo}</span>
              <div>
                <h3 className="font-semibold">{selectedProviderData.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedProviderData.description}</p>
              </div>
              <Button variant="outline" size="sm" asChild className="ml-auto bg-transparent">
                <a href={selectedProviderData.docUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Docs
                </a>
              </Button>
            </div>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic Setup</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">Agent Name</Label>
                    <Input
                      id="agent-name"
                      value={connectionData.name}
                      onChange={(e) => setConnectionData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="My OpenAI Agent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select
                      value={connectionData.model}
                      onValueChange={(value) => setConnectionData((prev) => ({ ...prev, model: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvider === "openai" && (
                          <>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          </>
                        )}
                        {selectedProvider === "anthropic" && (
                          <>
                            <SelectItem value="claude-3-opus-20240229">Claude 3 Opus</SelectItem>
                            <SelectItem value="claude-3-sonnet-20240229">Claude 3 Sonnet</SelectItem>
                            <SelectItem value="claude-3-haiku-20240307">Claude 3 Haiku</SelectItem>
                          </>
                        )}
                        {selectedProvider === "groq" && (
                          <>
                            <SelectItem value="llama3-70b-8192">Llama 3 70B</SelectItem>
                            <SelectItem value="llama3-8b-8192">Llama 3 8B</SelectItem>
                            <SelectItem value="mixtral-8x7b-32768">Mixtral 8x7B</SelectItem>
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {selectedProviderData.authType === "API Key" ? (
                  <div className="space-y-2">
                    <Label htmlFor="api-key" className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Key
                    </Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={connectionData.apiKey}
                      onChange={(e) => setConnectionData((prev) => ({ ...prev, apiKey: e.target.value }))}
                      placeholder="sk-..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Your API key is encrypted and stored securely. Get your key from the {selectedProviderData.name}{" "}
                      dashboard.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">OAuth Authentication</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Connect securely using OAuth. You'll be redirected to {selectedProviderData.name} to authorize
                        access.
                      </p>
                      <Button onClick={() => handleOAuthConnect(selectedProvider!)} disabled={isConnecting}>
                        {isConnecting ? "Connecting..." : `Connect with ${selectedProviderData.name}`}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={connectionData.description}
                    onChange={(e) => setConnectionData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Production agent for customer support"
                  />
                </div>
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Custom Endpoint (Optional)</Label>
                  <Input
                    id="endpoint"
                    value={connectionData.endpoint}
                    onChange={(e) => setConnectionData((prev) => ({ ...prev, endpoint: e.target.value }))}
                    placeholder={`https://api.${selectedProvider}.com/v1`}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setConnectionStep("select")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={
                    !connectionData.name ||
                    (!connectionData.apiKey && selectedProviderData.authType === "API Key") ||
                    isConnecting
                  }
                >
                  {isConnecting ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  onClick={() => setConnectionStep("success")}
                  disabled={
                    !connectionData.name || (!connectionData.apiKey && selectedProviderData.authType === "API Key")
                  }
                >
                  Connect Agent
                </Button>
              </div>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-lg border ${testResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <div className="flex items-center gap-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={`font-medium ${testResult.success ? "text-green-800" : "text-red-800"}`}>
                    {testResult.message}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {connectionStep === "success" && selectedProviderData && (
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">Agent Connected Successfully!</h3>
                <p className="text-muted-foreground">
                  {connectionData.name} is now connected to your {user?.organization} organization.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-left">
              <h4 className="font-medium mb-2">What's Next?</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Your agent will appear in the Agent Management dashboard</li>
                <li>• Governance policies will automatically apply to this agent</li>
                <li>• Monitor usage and performance in the Analytics section</li>
                <li>• Set up custom alerts and notifications</li>
              </ul>
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button onClick={handleSaveAgent} disabled={isConnecting}>
                {isConnecting ? "Saving..." : "Save & Continue"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
