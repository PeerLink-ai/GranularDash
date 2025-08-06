"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Check, Code, Webhook, Key } from "lucide-react"
import { toast } from "sonner"

interface IntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IntegrationModal({ open, onOpenChange }: IntegrationModalProps) {
  const [step, setStep] = useState<"register" | "integrate">("register")
  const [agentData, setAgentData] = useState({
    name: "",
    description: "",
    type: "",
    environment: "development",
  })
  const [credentials, setCredentials] = useState<{
    apiKey: string
    webhookUrl: string
    webhookSecret: string
  } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleRegister = async () => {
    if (!agentData.name || !agentData.type) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agentData),
      })

      if (!response.ok) throw new Error("Failed to register agent")

      const result = await response.json()
      setCredentials(result.credentials)
      setStep("integrate")
      toast.success("Agent registered successfully!")
    } catch (error) {
      toast.error("Failed to register agent")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
    toast.success("Copied to clipboard")
  }

  const apiExample = `import requests

# Log an interaction
response = requests.post(
    'https://your-domain.com/api/monitoring/ingest',
    headers={
        'Authorization': 'Bearer ${credentials?.apiKey || "YOUR_API_KEY"}',
        'Content-Type': 'application/json'
    },
    json={
        'agent_id': 'your-agent-id',
        'interaction_type': 'completion',
        'input': 'User query here',
        'output': 'Agent response here',
        'metadata': {
            'model': 'gpt-4',
            'tokens_used': 150,
            'response_time_ms': 1200
        }
    }
)`

  const webhookExample = `// Express.js webhook handler
app.post('/webhook', (req, res) => {
    const signature = req.headers['x-webhook-signature']
    const payload = JSON.stringify(req.body)
    
    // Verify signature
    const expectedSignature = crypto
        .createHmac('sha256', '${credentials?.webhookSecret || "YOUR_WEBHOOK_SECRET"}')
        .update(payload)
        .digest('hex')
    
    if (signature === expectedSignature) {
        // Process the webhook data
        console.log('Agent activity:', req.body)
        res.status(200).send('OK')
    } else {
        res.status(401).send('Unauthorized')
    }
})`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {step === "register" ? (
          <>
            <DialogHeader>
              <DialogTitle>Connect Your AI Agent</DialogTitle>
              <DialogDescription>
                Register your AI agent to start monitoring its activities, compliance, and performance.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    placeholder="My AI Assistant"
                    value={agentData.name}
                    onChange={(e) => setAgentData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Agent Type *</Label>
                  <Select
                    value={agentData.type}
                    onValueChange={(value) => setAgentData((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select agent type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chatbot">Chatbot</SelectItem>
                      <SelectItem value="completion">Text Completion</SelectItem>
                      <SelectItem value="classification">Classification</SelectItem>
                      <SelectItem value="summarization">Summarization</SelectItem>
                      <SelectItem value="translation">Translation</SelectItem>
                      <SelectItem value="code-generation">Code Generation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your agent does..."
                  value={agentData.description}
                  onChange={(e) => setAgentData((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>

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
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleRegister} disabled={isLoading}>
                {isLoading ? "Registering..." : "Register Agent"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Integration Setup</DialogTitle>
              <DialogDescription>
                Your agent has been registered! Use these credentials to integrate monitoring.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      API Key
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-1 rounded flex-1 truncate">{credentials?.apiKey}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(credentials?.apiKey || "", "apiKey")}
                      >
                        {copiedField === "apiKey" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      Webhook URL
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-1 rounded flex-1 truncate">{credentials?.webhookUrl}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(credentials?.webhookUrl || "", "webhookUrl")}
                      >
                        {copiedField === "webhookUrl" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      Webhook Secret
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted p-1 rounded flex-1 truncate">{credentials?.webhookSecret}</code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(credentials?.webhookSecret || "", "webhookSecret")}
                      >
                        {copiedField === "webhookSecret" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Tabs defaultValue="api" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="api">API Integration</TabsTrigger>
                  <TabsTrigger value="webhook">Webhook Integration</TabsTrigger>
                  <TabsTrigger value="sdk">SDK Integration</TabsTrigger>
                </TabsList>

                <TabsContent value="api" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">REST API Integration</CardTitle>
                      <CardDescription>Send monitoring data directly to our API endpoint</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Python Example</Label>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{apiExample}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(apiExample, "apiExample")}
                          >
                            {copiedField === "apiExample" ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Code className="h-4 w-4" />
                        <span>Use this API key in your Authorization header</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="webhook" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Webhook Integration</CardTitle>
                      <CardDescription>Receive real-time notifications about your agent's activities</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Node.js Example</Label>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            <code>{webhookExample}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2"
                            onClick={() => copyToClipboard(webhookExample, "webhookExample")}
                          >
                            {copiedField === "webhookExample" ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Webhook className="h-4 w-4" />
                        <span>Configure your endpoint to receive webhook events</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="sdk" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">SDK Integration</CardTitle>
                      <CardDescription>Use our SDKs for seamless integration (Coming Soon)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center py-8">
                        <Code className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">SDKs Coming Soon</h3>
                        <p className="text-muted-foreground mb-4">
                          We're working on Python and JavaScript SDKs to make integration even easier.
                        </p>
                        <div className="flex gap-2 justify-center">
                          <Badge variant="secondary">Python SDK</Badge>
                          <Badge variant="secondary">JavaScript SDK</Badge>
                          <Badge variant="secondary">Go SDK</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("register")}>
                Back
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
