"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Pause, SkipForward, CheckCircle, Clock, AlertTriangle, Brain, Shield, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface TrainingScenario {
  id: number
  title: string
  description: string
  weight: number
  type: "multiple_choice" | "scenario_response" | "hands_on" | "video" | "document"
  content: any
  timeLimit?: number
}

interface TrainingSession {
  id: string
  simulationId: string
  simulationName: string
  type: string
  difficulty: string
  scenarios: TrainingScenario[]
  estimatedDuration: number
  passThreshold: number
}

interface UserResponse {
  scenarioId: number
  response: string
  timeSpent: number
  startTime: number
  confidence?: number
}

interface TrainingEngineProps {
  sessionId: string
  onComplete: (results: any) => void
  onExit: () => void
}

export function InteractiveTrainingEngine({ sessionId, onComplete, onExit }: TrainingEngineProps) {
  const [session, setSession] = useState<TrainingSession | null>(null)
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0)
  const [responses, setResponses] = useState<UserResponse[]>([])
  const [currentResponse, setCurrentResponse] = useState("")
  const [confidence, setConfidence] = useState(3)
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [scenarioStartTime, setScenarioStartTime] = useState(Date.now())
  const [isPaused, setIsPaused] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isPaused && session) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isPaused, session])

  useEffect(() => {
    loadTrainingSession()
  }, [sessionId])

  const loadTrainingSession = async () => {
    try {
      const response = await fetch(`/api/training/sessions/${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setSession(data.session)
        setScenarioStartTime(Date.now())
      } else {
        toast({
          title: "Error",
          description: "Failed to load training session",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load session:", error)
      toast({
        title: "Error",
        description: "Failed to load training session",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleScenarioResponse = useCallback(() => {
    if (!session || !currentResponse.trim()) return

    const currentScenario = session.scenarios[currentScenarioIndex]
    const timeSpent = Math.floor((Date.now() - scenarioStartTime) / 1000)

    const newResponse: UserResponse = {
      scenarioId: currentScenario.id,
      response: currentResponse,
      timeSpent,
      startTime: scenarioStartTime,
      confidence,
    }

    setResponses((prev) => [...prev, newResponse])

    if (currentScenarioIndex < session.scenarios.length - 1) {
      setCurrentScenarioIndex((prev) => prev + 1)
      setCurrentResponse("")
      setConfidence(3)
      setScenarioStartTime(Date.now())
    } else {
      completeTraining()
    }
  }, [session, currentResponse, currentScenarioIndex, scenarioStartTime, confidence])

  const completeTraining = async () => {
    if (!session) return

    try {
      const results = await fetch(`/api/training/sessions/${sessionId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          totalTime: timeElapsed,
        }),
      })

      if (results.ok) {
        const data = await results.json()
        setShowResults(true)
        onComplete(data.results)
      }
    } catch (error) {
      console.error("Failed to complete training:", error)
      toast({
        title: "Error",
        description: "Failed to complete training session",
        variant: "destructive",
      })
    }
  }

  const renderScenarioContent = (scenario: TrainingScenario) => {
    switch (scenario.type) {
      case "multiple_choice":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">{scenario.content.question}</p>
            <RadioGroup value={currentResponse} onValueChange={setCurrentResponse}>
              {scenario.content.options.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="text-sm">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "scenario_response":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Scenario:</h4>
              <p className="text-sm">{scenario.content.scenario}</p>
            </div>
            <div>
              <Label htmlFor="response" className="text-sm font-medium">
                Your Response:
              </Label>
              <Textarea
                id="response"
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Describe how you would handle this situation..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        )

      case "hands_on":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center">
                <Zap className="h-4 w-4 mr-2 text-blue-600" />
                Hands-On Exercise
              </h4>
              <p className="text-sm mb-3">{scenario.content.instructions}</p>
              {scenario.content.steps && (
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  {scenario.content.steps.map((step: string, index: number) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              )}
            </div>
            <Textarea
              value={currentResponse}
              onChange={(e) => setCurrentResponse(e.target.value)}
              placeholder="Document your actions and observations..."
              rows={4}
            />
          </div>
        )

      case "video":
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <Play className="h-12 w-12 mx-auto mb-2" />
                <p>Training Video: {scenario.content.title}</p>
                <p className="text-sm opacity-75">Duration: {scenario.content.duration}min</p>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Key Takeaways:</Label>
              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="What are the main points from this video?"
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        )

      case "document":
        return (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg max-h-64 overflow-y-auto">
              <h4 className="font-medium mb-2">{scenario.content.title}</h4>
              <div className="text-sm space-y-2">
                {scenario.content.content.split("\n").map((paragraph: string, index: number) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Summary & Questions:</Label>
              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Summarize the key points and note any questions..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>
        )

      default:
        return <p>Unknown scenario type</p>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading training session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-medium mb-2">Session Not Found</h3>
        <p className="text-muted-foreground mb-4">The training session could not be loaded.</p>
        <Button onClick={onExit}>Return to Dashboard</Button>
      </div>
    )
  }

  const currentScenario = session.scenarios[currentScenarioIndex]
  const progress = ((currentScenarioIndex + 1) / session.scenarios.length) * 100
  const timeRemaining = Math.max(0, session.estimatedDuration * 60 - timeElapsed)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>{session.simulationName}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {session.type} • {session.difficulty} level
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => setIsPaused(!isPaused)}>
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button variant="outline" size="sm" onClick={onExit}>
                Exit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{currentScenarioIndex + 1}</div>
              <div className="text-xs text-muted-foreground">of {session.scenarios.length}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.floor(progress)}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.floor(timeElapsed / 60)}m</div>
              <div className="text-xs text-muted-foreground">Elapsed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{Math.floor(timeRemaining / 60)}m</div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>{currentScenario.title}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{currentScenario.description}</p>
            </div>
            <Badge variant="outline">Weight: {Math.round(currentScenario.weight * 100)}%</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {renderScenarioContent(currentScenario)}

          {(currentScenario.type === "scenario_response" || currentScenario.type === "multiple_choice") && (
            <div className="mt-6 pt-4 border-t">
              <Label className="text-sm font-medium">Confidence Level:</Label>
              <div className="flex items-center space-x-4 mt-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant={confidence === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setConfidence(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">1 = Not confident, 5 = Very confident</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Scenario time: {Math.floor((Date.now() - scenarioStartTime) / 1000)}s
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {currentScenarioIndex > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                setCurrentScenarioIndex((prev) => prev - 1)
                setCurrentResponse(responses[currentScenarioIndex - 1]?.response || "")
              }}
            >
              Previous
            </Button>
          )}
          <Button onClick={handleScenarioResponse} disabled={!currentResponse.trim() || isPaused} className="min-w-32">
            {currentScenarioIndex === session.scenarios.length - 1 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete
              </>
            ) : (
              <>
                <SkipForward className="h-4 w-4 mr-2" />
                Next
              </>
            )}
          </Button>
        </div>
      </div>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Training Complete!</DialogTitle>
            <DialogDescription>You have successfully completed the training simulation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">85%</div>
                <div className="text-sm text-muted-foreground">Final Score</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{responses.length}</div>
                <div className="text-sm text-muted-foreground">Scenarios</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.floor(timeElapsed / 60)}m</div>
                <div className="text-sm text-muted-foreground">Duration</div>
              </div>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium mb-2">Performance Summary</h4>
              <p className="text-sm text-muted-foreground">
                Excellent work! You demonstrated strong understanding of the key concepts. Your responses showed good
                analytical thinking and practical application.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Review Answers
              </Button>
              <Button onClick={onExit}>Return to Dashboard</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
