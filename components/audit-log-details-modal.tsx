"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, CheckCircle, AlertCircle, Clock, Lightbulb } from "lucide-react"

interface AuditLogDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  log: any
}

export function AuditLogDetailsModal({ isOpen, onClose, log }: AuditLogDetailsModalProps) {
  if (!log) return null

  const hasAIReasoning = () => {
    return log.details?.ai_reasoning
  }

  const renderConfidenceScore = (score: number) => {
    const percentage = Math.round(score * 100)
    const color = score >= 0.8 ? "text-green-600" : score >= 0.6 ? "text-yellow-600" : "text-red-600"
    return <span className={`font-medium ${color}`}>{percentage}%</span>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Audit Log Details
            {hasAIReasoning() && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Brain className="h-3 w-3" />
                AI Reasoning Available
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>Detailed information about the selected audit log entry.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai-reasoning" disabled={!hasAIReasoning()}>
              AI Reasoning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Timestamp:</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">User ID:</span>
                <span>{log.user_id}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Action:</span>
                <span>{log.action}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Resource Type:</span>
                <span>{log.resource_type}</span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <span className="font-medium">Resource ID:</span>
                <span>{log.resource_id || "-"}</span>
              </div>
              {log.ip_address && (
                <div className="grid grid-cols-2 gap-1">
                  <span className="font-medium">IP Address:</span>
                  <span>{log.ip_address}</span>
                </div>
              )}
              {log.details && (
                <>
                  <Separator className="my-2" />
                  <div className="grid grid-cols-1 gap-1">
                    <span className="font-medium">Technical Details:</span>
                    <div className="bg-muted p-3 rounded-md">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ai-reasoning" className="space-y-4">
            {hasAIReasoning() && (
              <div className="space-y-6">
                {/* Reasoning Steps */}
                {log.details.ai_reasoning.reasoning_steps && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        Reasoning Steps
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-2">
                        {log.details.ai_reasoning.reasoning_steps.map((step: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                )}

                {/* Decision Factors */}
                {log.details.ai_reasoning.decision_factors && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertCircle className="h-5 w-5 text-orange-600" />
                        Decision Factors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {log.details.ai_reasoning.decision_factors.map((factor: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium capitalize">{factor.factor.replace("_", " ")}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{factor.value}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  Weight: {Math.round(factor.weight * 100)}%
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{factor.reasoning}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Confidence Analysis */}
                {log.details.ai_reasoning.confidence_reasoning && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Brain className="h-5 w-5 text-purple-600" />
                        Confidence Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Overall Confidence:</span>
                          {renderConfidenceScore(log.details.ai_reasoning.confidence_reasoning.overall_confidence)}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(log.details.ai_reasoning.confidence_reasoning.factors).map(
                            ([key, value]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between">
                                <span className="text-sm capitalize">{key.replace("_", " ")}:</span>
                                {renderConfidenceScore(value)}
                              </div>
                            ),
                          )}
                        </div>
                        <div className="bg-muted p-3 rounded-md">
                          <p className="text-sm">{log.details.ai_reasoning.confidence_reasoning.explanation}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Thought Process */}
                {log.details.ai_reasoning.thought_process && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        Thought Process
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <span className="font-medium text-sm">Initial Assessment:</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.details.ai_reasoning.thought_process.initial_assessment}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Processing Strategy:</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.details.ai_reasoning.thought_process.processing_strategy}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Quality Checks:</span>
                          <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                            {log.details.ai_reasoning.thought_process.quality_checks.map(
                              (check: string, index: number) => (
                                <li key={index} className="flex items-center gap-2">
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                  {check}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>
                        <div>
                          <span className="font-medium text-sm">Final Decision:</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.details.ai_reasoning.thought_process.final_decision}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Alternative Approaches */}
                {log.details.ai_reasoning.alternative_approaches && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                        Alternative Approaches
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {log.details.ai_reasoning.alternative_approaches.map((approach: any, index: number) => (
                          <div key={index} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{approach.approach.replace("_", " ")}</span>
                              <Badge variant={approach.selected ? "default" : "secondary"}>
                                {approach.selected ? "Selected" : approach.considered ? "Considered" : "Not Considered"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{approach.reason}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
