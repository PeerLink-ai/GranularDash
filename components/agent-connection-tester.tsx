"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle, Play, Loader2 } from "lucide-react"

interface TestResult {
  name: string
  status: "passed" | "failed" | "unexpected"
  description: string
  error?: string
  result?: any
}

interface ConnectionTestResult {
  agentId: string
  scenario: string
  timestamp: string
  tests: TestResult[]
  success: boolean
  errors: string[]
}

export function AgentConnectionTester() {
  const [agentId, setAgentId] = useState("agent-test-123")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)

  const runConnectionTest = async () => {
    if (!agentId.trim()) return

    setIsLoading(true)
    setTestResult(null)

    try {
      const response = await fetch("/api/agents/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agentId.trim() }),
      })

      const result = await response.json()
      setTestResult(result)
    } catch (error: any) {
      setTestResult({
        agentId,
        scenario: "normal",
        timestamp: new Date().toISOString(),
        tests: [],
        success: false,
        errors: [error.message],
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "unexpected":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "passed":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "unexpected":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Agent Connection Tester
        </CardTitle>
        <CardDescription>
          Test agent SDK functionality including decision logging, tool interception, and communication recording
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <Label htmlFor="agentId">Agent ID</Label>
            <Input
              id="agentId"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="Enter agent ID to test"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={runConnectionTest}
              disabled={isLoading || !agentId.trim()}
              className="flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isLoading ? "Testing..." : "Run Test"}
            </Button>
          </div>
        </div>

        {testResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Test Results</h3>
              <Badge className={testResult.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {testResult.success ? "All Tests Passed" : "Some Tests Failed"}
              </Badge>
            </div>

            <div className="text-sm text-gray-600">
              Agent: {testResult.agentId} • Tested: {new Date(testResult.timestamp).toLocaleString()}
            </div>

            <div className="space-y-2">
              {testResult.tests.map((test, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{test.name}</span>
                      <Badge className={getStatusColor(test.status)}>{test.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{test.description}</p>
                    {test.error && <p className="text-sm text-red-600 mt-1">Error: {test.error}</p>}
                  </div>
                </div>
              ))}
            </div>

            {testResult.errors.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {testResult.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
