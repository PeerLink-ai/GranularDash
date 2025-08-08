"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { X, Bot, Zap, Shield, Brain, Code, MessageSquare, Search, Plus, ExternalLink, Check } from 'lucide-react'
import { toast } from "sonner"

interface IntegrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAgentConnected: () => void
}

const AGENT_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Connect GPT models for advanced language processing",
    icon: Brain,
    category: "AI Language Models",
    features: ["GPT-4", "GPT-3.5", "Function Calling", "Embeddings"],
    status: "popular",
    color: "bg-green-500"
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Constitutional AI for safe and helpful responses",
    icon: Shield,
    category: "AI Language Models", 
    features: ["Claude 3", "Safety First", "Long Context", "Code Analysis"],
    status: "recommended",
    color: "bg-orange-500"
  },
  {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference for real-time applications",
    icon: Zap,
    category: "High-Performance AI",
    features: ["Lightning Fast", "Low Latency", "Mixtral", "Llama 2"],
    status: "new",
    color: "bg-purple-500"
  },
  {
    id: "replit",
    name: "Replit Agent",
    description: "Code generation and execution environment",
    icon: Code,
    category: "Code Generation",
    features: ["Code Execution", "Multi-Language", "Real-time Collab", "Deployment"],
    status: "beta",
    color: "bg-blue-500"
  },
  {
    id: "custom",
    name: "Custom Agent",
    description: "Connect your own custom AI agent or API",
    icon: Bot,
    category: "Custom Integration",
    features: ["REST API", "Webhooks", "Custom Auth", "Flexible Config"],
    status: "advanced",
    color: "bg-gray-500"
  }
]

export function IntegrationModal({ isOpen, onOpenChange, onAgentConnected }: IntegrationModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("browse")
  const [isConnecting, setIsConnecting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    apiKey: "",
    endpoint: "",
    model: ""
  })

  const handleClose = () => {
    setSelectedProvider(null)
    setActiveTab("browse")
    setFormData({ name: "", description: "", apiKey: "", endpoint: "", model: "" })
    onOpenChange(false)
  }

  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId)
    setActiveTab("configure")
    
    // Pre-fill some data based on provider
    const provider = AGENT_PROVIDERS.find(p => p.id === providerId)
    if (provider) {
      setFormData(prev => ({
        ...prev,
        name: `${provider.name} Agent`,
        description: provider.description
      }))
    }
  }

  const handleConnect = async () => {
    if (!selectedProvider) return

    setIsConnecting(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success("Agent connected successfully!")
      onAgentConnected()
      handleClose()
    } catch (error) {
      toast.error("Failed to connect agent. Please try again.")
    } finally {
      setIsConnecting(false)
    }
  }

  const selectedProviderData = AGENT_PROVIDERS.find(p => p.id === selectedProvider)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">Connect New Agent</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose an AI provider and configure your agent connection
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-2 mx-6 mt-4">
              <TabsTrigger value="browse" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Browse Providers
              </TabsTrigger>
              <TabsTrigger value="configure" disabled={!selectedProvider} className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Configure Agent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
              <div className="grid gap-4 mt-4">
                {AGENT_PROVIDERS.map((provider) => {
                  const Icon = provider.icon
                  return (
                    <Card 
                      key={provider.id}
                      className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                        selectedProvider === provider.id ? 'border-primary' : 'border-border'
                      }`}
                      onClick={() => handleProviderSelect(provider.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${provider.color} text-white`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <CardTitle className="text-lg flex items-center gap-2">
                                {provider.name}
                                {provider.status === "popular" && (
                                  <Badge variant="secondary" className="text-xs">Popular</Badge>
                                )}
                                {provider.status === "recommended" && (
                                  <Badge className="text-xs bg-green-100 text-green-800">Recommended</Badge>
                                )}
                                {provider.status === "new" && (
                                  <Badge variant="outline" className="text-xs">New</Badge>
                                )}
                                {provider.status === "beta" && (
                                  <Badge variant="outline" className="text-xs text-blue-600">Beta</Badge>
                                )}
                                {provider.status === "advanced" && (
                                  <Badge variant="outline" className="text-xs text-purple-600">Advanced</Badge>
                                )}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {provider.description}
                              </CardDescription>
                            </div>
                          </div>
                          {selectedProvider === provider.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                          {provider.features.map((feature) => (
                            <Badge key={feature} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="configure" className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
              {selectedProviderData && (
                <div className="space-y-6 mt-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <div className={`p-2 rounded-lg ${selectedProviderData.color} text-white`}>
                      <selectedProviderData.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedProviderData.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedProviderData.description}</p>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="agent-name">Agent Name</Label>
                      <Input
                        id="agent-name"
                        placeholder="Enter a name for your agent"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="agent-description">Description</Label>
                      <Textarea
                        id="agent-description"
                        placeholder="Describe what this agent will be used for"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                      />
                    </div>

                    {selectedProvider !== "custom" && (
                      <div className="grid gap-2">
                        <Label htmlFor="api-key">API Key</Label>
                        <Input
                          id="api-key"
                          type="password"
                          placeholder="Enter your API key"
                          value={formData.apiKey}
                          onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                        />
                        <p className="text-xs text-muted-foreground">
                          Your API key will be encrypted and stored securely
                        </p>
                      </div>
                    )}

                    {selectedProvider === "custom" && (
                      <div className="grid gap-2">
                        <Label htmlFor="endpoint">API Endpoint</Label>
                        <Input
                          id="endpoint"
                          placeholder="https://api.example.com/v1"
                          value={formData.endpoint}
                          onChange={(e) => setFormData(prev => ({ ...prev, endpoint: e.target.value }))}
                        />
                      </div>
                    )}

                    {(selectedProvider === "openai" || selectedProvider === "anthropic") && (
                      <div className="grid gap-2">
                        <Label htmlFor="model">Model</Label>
                        <Select value={formData.model} onValueChange={(value) => setFormData(prev => ({ ...prev, model: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
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
                                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                                <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => setActiveTab("browse")}>
                      Back to Providers
                    </Button>
                    <Button 
                      onClick={handleConnect} 
                      disabled={!formData.name || !formData.apiKey || isConnecting}
                      className="min-w-[120px]"
                    >
                      {isConnecting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Connect Agent
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
