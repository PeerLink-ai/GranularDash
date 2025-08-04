"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Copy, Key, Code, Webhook, X, CheckCircle, AlertCircle, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"

interface IntegrationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onAgentConnected?: () => void
}

export function IntegrationModal({ isOpen, onOpenChange, onAgentConnected }: IntegrationModalProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<"setup" | "integration" | "success">("setup")
  const [isCreating, setIsCreating] = useState(false)
  const [agentData, setAgentData] = useState({
    name: "",
    description: "",
    type: "",
    environment: "production",
    framework: "",
    language: "",
  })
  const [createdAgent, setCreatedAgent] = useState<any>(null)

  const handleClose = () => {
    setStep("setup")
    setAgentData({ name: "", description: "", type: "", environment: "production", framework: "", language: "" })
    setCreatedAgent(null)
    onOpenChange(false)
  }

  const handleCreateAgent = async () => {
    if (!agentData.name || !agentData.type) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...agentData,
          organization: user?.organization,
        }),
      })

      if (response.ok) {
        const agent = await response.json()
        setCreatedAgent(agent)
        setStep("integration")
        toast.success("Agent registered successfully!")
      } else {
        throw new Error("Failed to register agent")
      }
    } catch (error) {
      toast.error("Failed to register agent")
    } finally {
      setIsCreating(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handleComplete = () => {
    onAgentConnected?.()
    handleClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Bot className="h-6 w-6" />
              Register AI Agent for Monitoring
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Register your AI agent with <strong>{user?.organization}</strong> to enable compliance monitoring, audit
              logging, and governance oversight.
            </DialogDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {step === "setup" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Agent Information</CardTitle>
                <CardDescription>
                  Provide details about your AI agent for proper monitoring and compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="agent-name">
                      Agent Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="agent-name"
                      value={agentData.name}
                      onChange={(e) => setAgentData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Customer Support Bot"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent-type">
                      Agent Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={agentData.type}
                      onValueChange={(value) => setAgentData((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="chatbot">Chatbot</SelectItem>
                        <SelectItem value="assistant">AI Assistant</SelectItem>
                        <SelectItem value="analyzer">Content Analyzer</SelectItem>
                        <SelectItem value="generator">Content Generator</SelectItem>
                        <SelectItem value="classifier">Text Classifier</SelectItem>
                        <SelectItem value="translator">Language Translator</SelectItem>
                        <SelectItem value="summarizer">Document Summarizer</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={agentData.description}
                    onChange={(e) => setAgentData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what your AI agent does and its primary use cases..."
                    rows={3}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select
                      value={agentData.environment}
                      onValueChange={(value) => setAgentData((prev) => ({ ...prev, environment: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="framework">Framework/Platform</Label>
                    <Select
                      value={agentData.framework}
                      onValueChange={(value) => setAgentData((prev) => ({ ...prev, framework: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select framework" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI API</SelectItem>
                        <SelectItem value="langchain">LangChain</SelectItem>
                        <SelectItem value="llamaindex">LlamaIndex</SelectItem>
                        <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                        <SelectItem value="huggingface">Hugging Face</SelectItem>
                        <SelectItem value="custom">Custom Implementation</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Programming Language</Label>
                    <Select
                      value={agentData.language}
                      onValueChange={(value) => setAgentData((prev) => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                        <SelectItem value="csharp">C#</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleCreateAgent} disabled={isCreating} size="lg">
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Agent...
                  </>
                ) : (
                  <>
                    <Bot className="mr-2 h-4 w-4" />
                    Register Agent
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === "integration" && createdAgent && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Agent Registered Successfully!</h3>
                <p className="text-sm text-green-700">
                  {createdAgent.name} is now registered. Follow the integration steps below to start monitoring.
                </p>
              </div>
            </div>

            <Tabs defaultValue="api-key" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="api-key">API Key Integration</TabsTrigger>
                <TabsTrigger value="webhook">Webhook Integration</TabsTrigger>
                <TabsTrigger value="sdk">SDK Integration</TabsTrigger>
              </TabsList>

              <TabsContent value="api-key" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Key className="h-5 w-5" />
                      API Key Integration
                    </CardTitle>
                    <CardDescription>
                      Use this API key to send logs and metrics from your agent to our monitoring system
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Agent ID</Label>
                      <div className="flex items-center gap-2">
                        <Input value={createdAgent.agent_id} readOnly className="font-mono" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(createdAgent.agent_id, "Agent ID")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="flex items-center gap-2">
                        <Input value={createdAgent.api_key} readOnly className="font-mono" type="password" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(createdAgent.api_key, "API Key")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Monitoring Endpoint</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/monitoring/ingest`}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/monitoring/ingest`,
                              "Endpoint URL",
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Example Usage (Python)</h4>
                      <pre className="text-sm bg-black text-green-400 p-3 rounded overflow-x-auto">
                        {`import requests
import json

# Log an AI interaction
def log_interaction(prompt, response, metadata=None):
    payload = {
        "agent_id": "${createdAgent.agent_id}",
        "event_type": "interaction",
        "data": {
            "prompt": prompt,
            "response": response,
            "metadata": metadata or {}
        }
    }
    
    headers = {
        "Authorization": "Bearer ${createdAgent.api_key}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(
        "${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/monitoring/ingest",
        headers=headers,
        json=payload
    )
    
    return response.json()

# Example usage
log_interaction(
    prompt="What is the weather today?",
    response="I don't have access to real-time weather data.",
    metadata={"user_id": "user123", "session_id": "sess456"}
)`}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="webhook" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Webhook className="h-5 w-5" />
                      Webhook Integration
                    </CardTitle>
                    <CardDescription>
                      Configure your agent to send real-time events via webhooks for immediate monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={`${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/webhooks/${createdAgent.agent_id}`}
                          readOnly
                          className="font-mono"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            copyToClipboard(
                              `${process.env.NEXT_PUBLIC_APP_URL || "https://your-domain.com"}/api/webhooks/${createdAgent.agent_id}`,
                              "Webhook URL",
                            )
                          }
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Webhook Secret</Label>
                      <div className="flex items-center gap-2">
                        <Input value={createdAgent.webhook_secret} readOnly className="font-mono" type="password" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(createdAgent.webhook_secret, "Webhook Secret")}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Webhook Payload Example</h4>
                      <pre className="text-sm bg-black text-green-400 p-3 rounded overflow-x-auto">
                        {`{
  "event_type": "interaction",
  "timestamp": "2024-01-15T10:30:00Z",
  "agent_id": "${createdAgent.agent_id}",
  "data": {
    "prompt": "User input or query",
    "response": "AI agent response",
    "metadata": {
      "user_id": "user123",
      "session_id": "sess456",
      "model": "gpt-4",
      "tokens_used": 150,
      "response_time_ms": 1200
    }
  }
}`}
                      </pre>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800">Security Note</h4>
                          <p className="text-sm text-yellow-700">
                            Always validate webhook signatures using the provided secret to ensure data integrity and
                            security.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sdk" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      SDK Integration
                    </CardTitle>
                    <CardDescription>
                      Use our SDK for seamless integration with automatic logging and monitoring
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-3">
                        <h4 className="font-medium">Python SDK</h4>
                        <div className="bg-black text-green-400 p-3 rounded text-sm">
                          <div>pip install ai-governance-sdk</div>
                        </div>
                        <div className="bg-muted p-3 rounded text-sm">
                          <pre>{`from ai_governance import GovernanceClient

client = GovernanceClient(
    agent_id="${createdAgent.agent_id}",
    api_key="${createdAgent.api_key}"
)

# Automatic logging wrapper
@client.monitor
def my_ai_function(prompt):
    # Your AI logic here
    return "AI response"

# Manual logging
client.log_interaction(
    prompt="Hello",
    response="Hi there!",
    metadata={"user": "john"}
)`}</pre>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="font-medium">JavaScript SDK</h4>
                        <div className="bg-black text-green-400 p-3 rounded text-sm">
                          <div>npm install @ai-governance/sdk</div>
                        </div>
                        <div className="bg-muted p-3 rounded text-sm">
                          <pre>{`import { GovernanceClient } from '@ai-governance/sdk';

const client = new GovernanceClient({
  agentId: '${createdAgent.agent_id}',
  apiKey: '${createdAgent.api_key}'
});

// Log interactions
await client.logInteraction({
  prompt: 'Hello',
  response: 'Hi there!',
  metadata: { user: 'john' }
});`}</pre>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <ExternalLink className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-800">Documentation</h4>
                          <p className="text-sm text-blue-700 mb-2">
                            Visit our documentation for detailed integration guides and examples.
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <a href="/docs/integration" target="_blank" rel="noreferrer">
                              View Documentation
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("setup")}>
                Back
              </Button>
              <Button onClick={handleComplete} size="lg">
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
