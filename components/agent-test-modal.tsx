"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Brain, Bot, Code, Zap, Send, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export function AgentTestModal({ isOpen, onOpenChange, agent }) {
  const [testPrompt, setTestPrompt] = useState("Hello! Can you help me understand how AI governance works?")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const { toast } = useToast()

  if (!agent) return null

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "openai":
        return Brain
      case "anthropic":
        return Bot
      case "replit":
        return Code
      case "groq":
        return Zap
      default:
        return Bot
    }
  }

  const handleTest = async () => {
    if (!testPrompt.trim()) return

    setIsLoading(true)
    setTestResult(null)

    try {
      // Simulate API call to test the agent
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock response based on provider
      const mockResponses = {
        OpenAI:
          "AI governance involves implementing policies, procedures, and controls to ensure responsible AI development and deployment. This includes data quality management, model validation, bias detection, and compliance monitoring.",
        Anthropic:
          "AI governance is a comprehensive framework that ensures AI systems are developed and deployed responsibly. It encompasses ethical considerations, risk management, transparency, and accountability measures.",
        Replit:
          "// AI Governance Framework\nconst aiGovernance = {\n  policies: ['data-privacy', 'bias-prevention'],\n  monitoring: 'continuous',\n  compliance: 'regulatory-standards'\n}",
        Groq: "AI governance ensures responsible AI through systematic oversight, risk assessment, ethical guidelines, and continuous monitoring of AI systems throughout their lifecycle.",
      }

      const response = mockResponses[agent.provider] || "Test response from AI agent."

      setTestResult({
        success: true,
        response,
        latency: Math.floor(Math.random() * 500) + 200,
        tokensUsed: Math.floor(Math.random() * 100) + 50,
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Test Successful",
        description: "Agent responded successfully",
      })
    } catch (error) {
      setTestResult({
        success: false,
        error: "Failed to connect to agent",
        timestamp: new Date().toISOString(),
      })

      toast({
        title: "Test Failed",
        description: "Agent test failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const Icon = getProviderIcon(agent.provider)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Icon className="h-5 w-5" />
            <span>Test {agent.name}</span>
          </DialogTitle>
          <DialogDescription>Send a test prompt to verify the agent is working correctly</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Agent Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Provider</p>
                  <p>{agent.provider}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Model</p>
                  <p>{agent.model}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={agent.status === "active" ? "default" : "secondary"}>{agent.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Prompt</CardTitle>
              <CardDescription>Enter a prompt to test the agent's response</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your test prompt here..."
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button onClick={handleTest} disabled={isLoading || !testPrompt.trim()} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Agent...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Test Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span>Test Results</span>
                </CardTitle>
                <CardDescription>{testResult.success ? "Agent responded successfully" : "Test failed"}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResult.success ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Response:</p>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{testResult.response}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold">{testResult.latency}ms</p>
                        <p className="text-xs text-muted-foreground">Response Time</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold">{testResult.tokensUsed}</p>
                        <p className="text-xs text-muted-foreground">Tokens Used</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-600">✓</p>
                        <p className="text-xs text-muted-foreground">Status</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Error:</p>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{testResult.error}</p>
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground">
                  Tested at: {new Date(testResult.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
