"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Brain, Clock, Zap, Target, Lightbulb } from "lucide-react"

interface AIThoughtProcessLog {
  id: number
  agent_id: string
  session_id?: string
  thought_type: string
  prompt?: string
  thought_content: string
  context_data?: Record<string, any>
  confidence_score?: number
  reasoning_steps?: string[]
  decision_factors?: Record<string, any>
  alternatives_considered?: Record<string, any>
  outcome_prediction?: string
  processing_time_ms?: number
  model_used?: string
  temperature?: number
  tokens_used?: number
  created_at: string
}

interface AIThoughtDetailsModalProps {
  log: AIThoughtProcessLog | null
  isOpen: boolean
  onClose: () => void
}

const thoughtTypeColors = {
  reasoning: "bg-blue-100 text-blue-800",
  decision: "bg-green-100 text-green-800",
  analysis: "bg-purple-100 text-purple-800",
  planning: "bg-orange-100 text-orange-800",
  reflection: "bg-gray-100 text-gray-800",
}

export function AIThoughtDetailsModal({ log, isOpen, onClose }: AIThoughtDetailsModalProps) {
  if (!log) return null

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return "bg-gray-100 text-gray-800"
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Thought Process Details
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Agent ID</h4>
                <p className="font-mono text-sm">{log.agent_id}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Thought Type</h4>
                <Badge className={thoughtTypeColors[log.thought_type as keyof typeof thoughtTypeColors]}>
                  {log.thought_type}
                </Badge>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Timestamp</h4>
                <p className="text-sm">{new Date(log.created_at).toLocaleString()}</p>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Confidence Score</h4>
                {log.confidence_score ? (
                  <Badge className={getConfidenceColor(log.confidence_score)}>
                    {Math.round(log.confidence_score * 100)}%
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">Not specified</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Prompt */}
            {log.prompt && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Original Prompt
                </h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{log.prompt}</p>
                </div>
              </div>
            )}

            {/* Thought Content */}
            <div>
              <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Thought Process
              </h4>
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{log.thought_content}</p>
              </div>
            </div>

            {/* Reasoning Steps */}
            {log.reasoning_steps && log.reasoning_steps.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Reasoning Steps
                </h4>
                <div className="space-y-2">
                  {log.reasoning_steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <p className="text-sm flex-1">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Factors */}
            {log.decision_factors && Object.keys(log.decision_factors).length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Decision Factors</h4>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs overflow-x-auto">{JSON.stringify(log.decision_factors, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Context Data */}
            {log.context_data && Object.keys(log.context_data).length > 0 && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Context Data</h4>
                <div className="bg-muted p-3 rounded-md">
                  <pre className="text-xs overflow-x-auto">{JSON.stringify(log.context_data, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Outcome Prediction */}
            {log.outcome_prediction && (
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-2">Predicted Outcome</h4>
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm">{log.outcome_prediction}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Technical Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-muted-foreground mb-1">Model Used</h4>
                <p>{log.model_used || "Not specified"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-muted-foreground mb-1">Processing Time</h4>
                <p className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {log.processing_time_ms ? `${log.processing_time_ms}ms` : "Not recorded"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-muted-foreground mb-1">Temperature</h4>
                <p>{log.temperature || "Not specified"}</p>
              </div>
              <div>
                <h4 className="font-semibold text-muted-foreground mb-1">Tokens Used</h4>
                <p className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {log.tokens_used || "Not recorded"}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
