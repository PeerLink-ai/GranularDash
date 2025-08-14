"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, CheckCircle, AlertTriangle, Info, Target, Brain, Shield, Lightbulb, ArrowRight } from "lucide-react"
import type { TrainingScenario, ScenarioStep } from "@/lib/training-scenarios"
import { toast } from "@/hooks/use-toast"

interface ScenarioPlayerProps {
  scenarioId: string
  onComplete: (results: any) => void
  onExit: () => void
}

interface StepResponse {
  stepId: string
  selectedOptions: string[]
  textResponse?: string
  timeSpent: number
  timestamp: number
}

export function ScenarioPlayer({ scenarioId, onComplete, onExit }: ScenarioPlayerProps) {
  const [scenario, setScenario] = useState<TrainingScenario | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [responses, setResponses] = useState<StepResponse[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [textResponse, setTextResponse] = useState("")
  const [stepStartTime, setStepStartTime] = useState(Date.now())
  const [totalScore, setTotalScore] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadScenario()
  }, [scenarioId])

  const loadScenario = async () => {
    try {
      const response = await fetch(`/api/training/scenarios/${scenarioId}`)
      if (response.ok) {
        const data = await response.json()
        setScenario(data.scenario)
        setStepStartTime(Date.now())
      } else {
        toast({
          title: "Error",
          description: "Failed to load training scenario",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load scenario:", error)
      toast({
        title: "Error",
        description: "Failed to load training scenario",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleStepResponse = () => {
    if (!scenario) return

    const currentStep = scenario.steps[currentStepIndex]
    const timeSpent = Date.now() - stepStartTime

    const stepResult = calculateStepScore(currentStep, selectedOptions, textResponse)
    setTotalScore((prev) => prev + stepResult.score)
    setCurrentFeedback(stepResult.feedback)
    setShowFeedback(true)

    const response: StepResponse = {
      stepId: currentStep.id,
      selectedOptions: [...selectedOptions],
      textResponse: textResponse.trim() || undefined,
      timeSpent,
      timestamp: Date.now(),
    }

    setResponses((prev) => [...prev, response])
  }

  const proceedToNextStep = () => {
    if (!scenario) return

    setShowFeedback(false)
    setSelectedOptions([])
    setTextResponse("")
    setStepStartTime(Date.now())

    if (currentStepIndex < scenario.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1)
    } else {
      completeScenario()
    }
  }

  const calculateStepScore = (step: ScenarioStep, options: string[], text: string) => {
    let score = 0
    const feedback: string[] = []

    if (step.type === "decision" && step.options) {
      for (const optionId of options) {
        const option = step.options.find((opt) => opt.id === optionId)
        if (option) {
          score += option.points
          feedback.push(option.feedback)
        }
      }
    } else if (step.type === "assessment" && step.options) {
      for (const optionId of options) {
        const option = step.options.find((opt) => opt.id === optionId)
        if (option) {
          score += option.points
          feedback.push(option.feedback)
        }
      }
    } else if (text.length > 0) {
      score = Math.min(10, Math.floor(text.length / 50) * 2 + 3)
      feedback.push("Thank you for your detailed response. Your analysis will be reviewed.")
    }

    return { score: Math.max(0, score), feedback }
  }

  const completeScenario = () => {
    if (!scenario) return

    const totalTime = responses.reduce((sum, r) => sum + r.timeSpent, 0)
    const maxPossibleScore = calculateMaxScore(scenario)
    const finalScore = Math.round((totalScore / maxPossibleScore) * 100)

    const results = {
      scenarioId: scenario.id,
      finalScore,
      totalScore,
      maxPossibleScore,
      totalTime: Math.floor(totalTime / 1000),
      responses,
      completedSteps: responses.length,
      totalSteps: scenario.steps.length,
    }

    onComplete(results)
  }

  const calculateMaxScore = (scenario: TrainingScenario): number => {
    return scenario.steps.reduce((total, step) => {
      if (step.options) {
        const maxStepScore = Math.max(...step.options.map((opt) => opt.points))
        return total + Math.max(0, maxStepScore)
      }
      return total + 10 // Default max for text responses
    }, 0)
  }

  const renderStepContent = (step: ScenarioStep) => {
    switch (step.type) {
      case "information":
        return (
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{step.content}</AlertDescription>
            </Alert>
          </div>
        )

      case "decision":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">{step.content}</p>
            <RadioGroup value={selectedOptions[0] || ""} onValueChange={(value) => setSelectedOptions([value])}>
              {step.options?.map((option) => (
                <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                  <Label htmlFor={option.id} className="text-sm leading-relaxed cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "assessment":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">{step.content}</p>
            <div className="space-y-2">
              {step.options?.map((option) => (
                <div key={option.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <input
                    type="checkbox"
                    id={option.id}
                    checked={selectedOptions.includes(option.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedOptions((prev) => [...prev, option.id])
                      } else {
                        setSelectedOptions((prev) => prev.filter((id) => id !== option.id))
                      }
                    }}
                    className="mt-1"
                  />
                  <Label htmlFor={option.id} className="text-sm leading-relaxed cursor-pointer">
                    {option.text}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      case "action":
        return (
          <div className="space-y-4">
            <Alert>
              <Target className="h-4 w-4" />
              <AlertDescription className="whitespace-pre-line">{step.content}</AlertDescription>
            </Alert>
            <div>
              <Label className="text-sm font-medium">Your Action Plan:</Label>
              <Textarea
                value={textResponse}
                onChange={(e) => setTextResponse(e.target.value)}
                placeholder="Describe the specific actions you would take..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        )

      default:
        return <p className="text-muted-foreground">Unknown step type</p>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading scenario...</p>
        </div>
      </div>
    )
  }

  if (!scenario) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-medium mb-2">Scenario Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested training scenario could not be loaded.</p>
        <Button onClick={onExit}>Return to Training</Button>
      </div>
    )
  }

  const currentStep = scenario.steps[currentStepIndex]
  const progress = ((currentStepIndex + 1) / scenario.steps.length) * 100
  const canProceed = selectedOptions.length > 0 || textResponse.trim().length > 0 || currentStep.type === "information"

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>{scenario.title}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {scenario.category} • {scenario.difficulty} level • ~{scenario.estimatedTime}min
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium">Score: {totalScore}</div>
                <div className="text-xs text-muted-foreground">
                  Step {currentStepIndex + 1} of {scenario.steps.length}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={onExit}>
                Exit
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>{currentStep.title}</span>
          </CardTitle>
          {currentStep.timeLimit && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Time limit: {currentStep.timeLimit} seconds</span>
            </div>
          )}
        </CardHeader>
        <CardContent>{renderStepContent(currentStep)}</CardContent>
      </Card>

      {showFeedback && currentFeedback.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Feedback</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {currentFeedback.map((feedback, index) => (
                <Alert key={index}>
                  <AlertDescription>{feedback}</AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Step time: {Math.floor((Date.now() - stepStartTime) / 1000)}s
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {showFeedback ? (
            <Button onClick={proceedToNextStep} className="min-w-32">
              {currentStepIndex === scenario.steps.length - 1 ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Continue
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleStepResponse} disabled={!canProceed} className="min-w-32">
              <ArrowRight className="h-4 w-4 mr-2" />
              Submit
            </Button>
          )}
        </div>
      </div>

      {scenario.learningObjectives.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Learning Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {scenario.learningObjectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <Target className="h-3 w-3 mt-1 text-muted-foreground flex-shrink-0" />
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
