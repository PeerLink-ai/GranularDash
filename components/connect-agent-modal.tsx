"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, Code, Webhook, Key } from "lucide-react"
import { toast } from "sonner"

interface ConnectAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAgentConnected: () => void
}

interface AgentCredentials {
  apiKey: string
  webhookUrl: string
  webhookSecret: string
  integrationExamples: {
    python: string
    javascript: string
    webhook: string
  }
}

export function ConnectAgentModal({ open, onOpenChange, onAgentConnected }: ConnectAgentModalProps) {
  const [step, setStep] = useState<"form" | "credentials">("form")
  const [loading, setLoading] = useState(false)
  const [credentials, setCredentials] = useState<AgentCredentials | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "",
    environment: "production",
    framework: "",
    language: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Failed to register agent")
      }

      const data = await response.json()
      setCredentials(data.credentials)
      setCredentials((prev) => ({
        ...prev!,
        integrationExamples: data.integrationExamples,
      }))
      setStep("credentials")
      toast.success("Agent registered successfully!")
    } catch (error) {
      console.error("Error registering agent:", error)
      toast.error("Failed to register agent")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success("Copied to clipboard!")
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      toast.error("Failed to copy to clipboard")
    }
  }

  const handleClose = () => {
    if (step === "credentials") {
      onAgentConnected()
    }
    onOpenChange(false)
    setStep("form")
    setCredentials(null)
    setFormData({
      name: "",
      description: "",
      type: "",
      environment: "production",
      framework: "",
      language: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{step === "form" ? "Connect New Agent" : "Agent Integration Details"}</DialogTitle>
          <DialogDescription>
            {step === "form"
              ? "Register your AI agent for monitoring and compliance oversight"
              : "Use these credentials to integrate your agent with our monitoring system"}
          </DialogDescription>
        </DialogHeader>

        {step === "form" ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="My AI Assistant"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Agent Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chatbot">Chatbot</SelectItem>
                    <SelectItem value="assistant">AI Assistant</SelectItem>
                    <SelectItem value="classifier">Text Classifier</SelectItem>
                    <SelectItem value="generator">Content Generator</SelectItem>
                    <SelectItem value="analyzer">Data Analyzer</SelectItem>
                    <SelectItem value="custom">Custom Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what your agent does..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="environment">Environment</Label>
                <Select
                  value={formData.environment}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, environment: value }))}
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
                <Label htmlFor="framework">Framework</Label>
                <Select
                  value={formData.framework}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, framework: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI API</SelectItem>
                    <SelectItem value="langchain">LangChain</SelectItem>
                    <SelectItem value="llamaindex">LlamaIndex</SelectItem>
                    <SelectItem value="huggingface">Hugging Face</SelectItem>
                    <SelectItem value="custom">Custom Framework</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, language: value }))}
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
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Registering..." : "Register Agent"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    API Key
                  </CardTitle>
                  <CardDescription>Use this API key to authenticate your agent's requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <Input value={credentials?.apiKey || ""} readOnly className="font-mono text-sm" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(credentials?.apiKey || "", "apiKey")}
                    >
                      {copiedField === "apiKey" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-4 w-4" />
                    Webhook Details
                  </CardTitle>
                  <CardDescription>Configure your agent to send events to this webhook endpoint</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Webhook URL</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={credentials?.webhookUrl || ""} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(credentials?.webhookUrl || "", "webhookUrl")}
                      >
                        {copiedField === "webhookUrl" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Webhook Secret</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input value={credentials?.webhookSecret || ""} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(credentials?.webhookSecret || "", "webhookSecret")}
                      >
                        {copiedField === "webhookSecret" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  Integration Examples
                </CardTitle>
                <CardDescription>Copy and paste these examples to integrate your agent</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="python" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                  </TabsList>
                  <TabsContent value="python" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Python Example</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(credentials?.integrationExamples?.python || "", "python")}
                      >
                        {copiedField === "python" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{credentials?.integrationExamples?.python}</code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="javascript" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">JavaScript Example</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToClipboard(credentials?.integrationExamples?.javascript || "", "javascript")
                        }
                      >
                        {copiedField === "javascript" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{credentials?.integrationExamples?.javascript}</code>
                    </pre>
                  </TabsContent>
                  <TabsContent value="webhook" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Webhook Configuration</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(credentials?.integrationExamples?.webhook || "", "webhook")}
                      >
                        {copiedField === "webhook" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{credentials?.integrationExamples?.webhook}</code>
                    </pre>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
