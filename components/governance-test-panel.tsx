"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Clock, Zap, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface GovernanceTestResult {
  response: string
  responseTime: number
  tokenUsage: {
    prompt: number
    completion: number
    total: number
  }
  evaluation: {
    relevance: number
    accuracy: number
    safety: number
    coherence: number
    overall: number
    flags: string[]
    reasoning: string
  }
}

interface CryptographicProof {
  blockHash: string
  blockId: string
  signature: string
  chainValid: boolean
  timestamp: number
}

export default function GovernanceTestPanel({ agentId }: { agentId: string }) {
  const [testPrompt, setTestPrompt] = useState(
    "Explain the importance of AI safety and ethical considerations in modern AI systems.",
  )
  const [expectedContext, setExpectedContext] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<GovernanceTestResult | null>(null)
  const [cryptoProof, setCryptoProof] = useState<CryptographicProof | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runGovernanceTest = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)
    setCryptoProof(null)

    try {
      const response = await fetch(`/api/agents/${agentId}/governance-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testPrompt, expectedContext }),
      })

      if (!response.ok) {
        throw new Error(`Test failed: ${response.status}`)
      }

      const data = await response.json()
      setTestResult(data.testResults)
      setCryptoProof(data.cryptographicProof)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4 text-green-600" />
    if (score >= 70) return <AlertTriangle className="h-4 w-4 text-yellow-600" />
    return <XCircle className="h-4 w-4 text-red-600" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI Governance Test
          </CardTitle>
          <CardDescription>Test agent responses with cryptographic audit trail and quality evaluation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Test Prompt</label>
            <Textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Enter a test prompt for the AI agent..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Expected Context (Optional)</label>
            <Textarea
              value={expectedContext}
              onChange={(e) => setExpectedContext(e.target.value)}
              placeholder="Provide expected context for accuracy evaluation..."
              rows={2}
            />
          </div>

          <Button onClick={runGovernanceTest} disabled={isLoading || !testPrompt.trim()} className="w-full">
            {isLoading ? "Running Governance Test..." : "Run Cryptographic Test"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="font-medium">Test Failed</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {testResult && (
        <div className="space-y-4">
          {/* Response Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Quality Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getScoreIcon(testResult.evaluation.relevance)}
                    <span className="text-sm font-medium">Relevance</span>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(testResult.evaluation.relevance)}`}>
                    {testResult.evaluation.relevance}%
                  </div>
                  <Progress value={testResult.evaluation.relevance} className="mt-2" />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getScoreIcon(testResult.evaluation.accuracy)}
                    <span className="text-sm font-medium">Accuracy</span>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(testResult.evaluation.accuracy)}`}>
                    {testResult.evaluation.accuracy}%
                  </div>
                  <Progress value={testResult.evaluation.accuracy} className="mt-2" />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getScoreIcon(testResult.evaluation.safety)}
                    <span className="text-sm font-medium">Safety</span>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(testResult.evaluation.safety)}`}>
                    {testResult.evaluation.safety}%
                  </div>
                  <Progress value={testResult.evaluation.safety} className="mt-2" />
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getScoreIcon(testResult.evaluation.overall)}
                    <span className="text-sm font-medium">Overall</span>
                  </div>
                  <div className={`text-2xl font-bold ${getScoreColor(testResult.evaluation.overall)}`}>
                    {testResult.evaluation.overall}%
                  </div>
                  <Progress value={testResult.evaluation.overall} className="mt-2" />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Evaluation Reasoning</h4>
                <p className="text-sm text-gray-600">{testResult.evaluation.reasoning}</p>
              </div>

              {testResult.evaluation.flags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Quality Flags</h4>
                  <div className="flex flex-wrap gap-2">
                    {testResult.evaluation.flags.map((flag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-600">Response Time</div>
                    <div className="font-semibold">{testResult.responseTime}ms</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-sm text-gray-600">Total Tokens</div>
                    <div className="font-semibold">{testResult.tokenUsage.total}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-sm text-gray-600">Safety Score</div>
                    <div className="font-semibold">{testResult.evaluation.safety}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cryptographic Proof */}
          {cryptoProof && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cryptographic Audit Proof</CardTitle>
                <CardDescription>Immutable blockchain-like record of this interaction</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Block ID:</span>
                    <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1">{cryptoProof.blockId}</div>
                  </div>

                  <div>
                    <span className="font-medium">Chain Status:</span>
                    <div className="mt-1">
                      <Badge variant={cryptoProof.chainValid ? "default" : "destructive"}>
                        {cryptoProof.chainValid ? "VERIFIED" : "COMPROMISED"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-medium">Block Hash:</span>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                    {cryptoProof.blockHash}
                  </div>
                </div>

                <div>
                  <span className="font-medium">Digital Signature:</span>
                  <div className="font-mono text-xs bg-gray-100 p-2 rounded mt-1 break-all max-h-20 overflow-y-auto">
                    {cryptoProof.signature}
                  </div>
                </div>

                <div className="text-xs text-gray-500">
                  Timestamp: {new Date(cryptoProof.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Agent Response */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Agent Response</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{testResult.response}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
