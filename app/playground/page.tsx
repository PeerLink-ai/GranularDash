"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Play, Clock, Database, MessageSquare, Zap, Shield } from "lucide-react"

interface Agent {
  id: string
  name: string
  type: string
  endpoint: string
  status: string
}

interface LineageEntry {
  id: string
  timestamp: string
  type: "prompt" | "response" | "tool_call" | "db_query" | "decision"
  content: string
  metadata: any
  duration?: number
  tokens?: number
}

interface PlaygroundResponse {
  response: string
  responseTime: number
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  lineageId: string
  cryptographicProof: {
    blockHash: string
    signature: string
    chainValid: boolean
  }
}

export default function PlaygroundPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>("")
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<PlaygroundResponse | null>(null)
  const [lineage, setLineage] = useState<LineageEntry[]>([])
  const { toast } = useToast()

  // Load connected agents
  useEffect(() => {
    const loadAgents = async () => {
      try {
        const res = await fetch("/api/agents")
        if (res.ok) {
          const data = await res.json()
          setAgents(data.agents || [])
        }
      } catch (error) {
        console.error("Failed to load agents:", error)
      }
    }
    loadAgents()
  }, [])

  // Test agent with full lineage tracking
  const testAgent = async () => {
    if (!selectedAgent || !prompt.trim()) return

    setIsLoading(true)
    setResponse(null)
    setLineage([])

    try {
      // Add initial prompt to lineage
      const promptEntry: LineageEntry = {
        id: `prompt-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "prompt",
        content: prompt,
        metadata: { agentId: selectedAgent },
      }
      setLineage([promptEntry])

      const res = await fetch(`/api/playground/test-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent,
          prompt: prompt.trim(),
        }),
      })

      if (!res.ok) {
        throw new Error(`Test failed: ${res.status}`)
      }

      const data: PlaygroundResponse = await res.json()
      setResponse(data)

      // Add response to lineage
      const responseEntry: LineageEntry = {
        id: `response-${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: "response",
        content: data.response,
        metadata: {
          agentId: selectedAgent,
          lineageId: data.lineageId,
          tokenUsage: data.tokenUsage,
          cryptographicProof: data.cryptographicProof,
        },
        duration: data.responseTime,
        tokens: data.tokenUsage.total,
      }

      setLineage((prev) => [...prev, responseEntry])

      toast({
        title: "Agent Test Complete",
        description: `Response generated in ${data.responseTime}ms with ${data.tokenUsage.total} tokens`,
      })
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getLineageIcon = (type: string) => {
    switch (type) {
      case "prompt":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "response":
        return <Zap className="h-4 w-4 text-green-500" />
      case "tool_call":
        return <Shield className="h-4 w-4 text-purple-500" />
      case "db_query":
        return <Database className="h-4 w-4 text-orange-500" />
      case "decision":
        return <Shield className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const selectedAgentData = agents.find((a) => a.id === selectedAgent)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Agent Playground</h1>
        <p className="text-muted-foreground">
          Test connected agents with full lineage tracking and cryptographic audit trails
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Testing Interface */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Agent Testing
              </CardTitle>
              <CardDescription>
                Select an agent and enter a prompt to test with full governance tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Agent</label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a connected agent..." />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {agent.type}
                          </Badge>
                          {agent.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedAgentData && (
                  <p className="text-xs text-muted-foreground mt-1">Endpoint: {selectedAgentData.endpoint}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Test Prompt</label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Enter your prompt to test the AI agent..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button onClick={testAgent} disabled={!selectedAgent || !prompt.trim() || isLoading} className="w-full">
                {isLoading ? "Testing Agent..." : "Test Agent"}
              </Button>
            </CardContent>
          </Card>

          {/* Response Display */}
          {response && (
            <Card>
              <CardHeader>
                <CardTitle>Agent Response</CardTitle>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Response Time: {response.responseTime}ms</span>
                  <span>Tokens: {response.tokenUsage.total}</span>
                  <Badge variant={response.cryptographicProof.chainValid ? "default" : "destructive"}>
                    {response.cryptographicProof.chainValid ? "VERIFIED" : "UNVERIFIED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="whitespace-pre-wrap text-sm">{response.response}</p>
                </div>

                <div className="mt-4 space-y-2">
                  <h4 className="font-medium text-sm">Cryptographic Proof</h4>
                  <div className="text-xs font-mono bg-muted p-2 rounded break-all">
                    Hash: {response.cryptographicProof.blockHash}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Lineage Tracking Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Lineage Log
              </CardTitle>
              <CardDescription>Real-time tracking of all interactions and decisions</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {lineage.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No interactions yet</p>
                    <p className="text-xs">Start testing an agent to see lineage</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lineage.map((entry, index) => (
                      <div key={entry.id} className="relative">
                        {index > 0 && <div className="absolute left-4 -top-3 w-px h-3 bg-border" />}
                        <div className="flex gap-3">
                          <div className="flex-shrink-0 mt-1">{getLineageIcon(entry.type)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs capitalize">
                                {entry.type.replace("_", " ")}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(entry.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm break-words">
                              {entry.content.length > 100 ? `${entry.content.substring(0, 100)}...` : entry.content}
                            </p>
                            {(entry.duration || entry.tokens) && (
                              <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                                {entry.duration && <span>{entry.duration}ms</span>}
                                {entry.tokens && <span>{entry.tokens} tokens</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        {index < lineage.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
