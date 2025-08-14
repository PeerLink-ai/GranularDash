"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Clock, CheckCircle, AlertTriangle, Brain, Target, Award, ArrowRight, ArrowLeft, Flag } from "lucide-react"
import type { Quiz, Question, QuizResponse } from "@/lib/assessment-system"
import { calculateQuizScore } from "@/lib/assessment-system"
import { toast } from "@/hooks/use-toast"

interface QuizPlayerProps {
  quizId: string
  onComplete: (results: any) => void
  onExit: () => void
}

export function QuizPlayer({ quizId, onComplete, onExit }: QuizPlayerProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [responses, setResponses] = useState<QuizResponse[]>([])
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>("")
  const [confidence, setConfidence] = useState(3)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [quizStartTime, setQuizStartTime] = useState(Date.now())
  const [showResults, setShowResults] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  useEffect(() => {
    if (quiz && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [quiz, timeRemaining])

  const loadQuiz = async () => {
    try {
      const response = await fetch(`/api/training/quizzes/${quizId}`)
      if (response.ok) {
        const data = await response.json()
        setQuiz(data.quiz)
        setTimeRemaining(data.quiz.timeLimit || 3600)
        setQuizStartTime(Date.now())
        setQuestionStartTime(Date.now())
      } else {
        toast({
          title: "Error",
          description: "Failed to load quiz",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to load quiz:", error)
      toast({
        title: "Error",
        description: "Failed to load quiz",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTimeUp = useCallback(() => {
    toast({
      title: "Time's Up!",
      description: "The quiz time limit has been reached. Submitting your current answers.",
      variant: "destructive",
    })
    completeQuiz()
  }, [])

  const handleAnswerSubmit = () => {
    if (!quiz || !currentAnswer) return

    const currentQuestion = quiz.questions[currentQuestionIndex]
    const timeSpent = Date.now() - questionStartTime
    const isCorrect = evaluateAnswer(currentQuestion, currentAnswer)
    const pointsEarned = isCorrect ? currentQuestion.points : 0

    const response: QuizResponse = {
      questionId: currentQuestion.id,
      answer: currentAnswer,
      timeSpent,
      confidence,
      isCorrect,
      pointsEarned,
    }

    setResponses((prev) => [...prev, response])

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
      setCurrentAnswer("")
      setConfidence(3)
      setQuestionStartTime(Date.now())
    } else {
      completeQuiz()
    }
  }

  const evaluateAnswer = (question: Question, answer: string | string[]): boolean => {
    switch (question.type) {
      case "multiple_choice":
      case "true_false":
        return answer === question.correctAnswer
      case "matching":
      case "ordering":
        if (Array.isArray(answer) && Array.isArray(question.correctAnswer)) {
          return JSON.stringify(answer.sort()) === JSON.stringify(question.correctAnswer.sort())
        }
        return false
      case "essay":
        // Essay questions require manual grading, return true for now
        return true
      default:
        return false
    }
  }

  const completeQuiz = () => {
    if (!quiz) return

    const totalTime = Date.now() - quizStartTime
    const results = calculateQuizScore(quiz, responses)

    const quizResults = {
      quizId: quiz.id,
      ...results,
      totalTime: Math.floor(totalTime / 1000),
      responses,
      flaggedQuestions: Array.from(flaggedQuestions),
      certificateEligible: results.passed && quiz.certification,
    }

    setShowResults(true)
    onComplete(quizResults)
  }

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index)
    setQuestionStartTime(Date.now())
  }

  const toggleFlag = (index: number) => {
    setFlaggedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const renderQuestion = (question: Question) => {
    switch (question.type) {
      case "multiple_choice":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">{question.question}</p>
            <RadioGroup value={currentAnswer as string} onValueChange={setCurrentAnswer}>
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                  <Label htmlFor={`option-${index}`} className="text-sm leading-relaxed cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "true_false":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">{question.question}</p>
            <RadioGroup value={currentAnswer as string} onValueChange={setCurrentAnswer}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="true" id="true" />
                <Label htmlFor="true" className="cursor-pointer">
                  True
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="false" id="false" />
                <Label htmlFor="false" className="cursor-pointer">
                  False
                </Label>
              </div>
            </RadioGroup>
          </div>
        )

      case "essay":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">{question.question}</p>
            <Textarea
              value={currentAnswer as string}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Provide a detailed answer..."
              className="min-h-32"
              rows={6}
            />
            <div className="text-xs text-muted-foreground">Minimum recommended length: 200 words</div>
          </div>
        )

      case "matching":
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">{question.question}</p>
            <div className="space-y-2">
              {question.options?.map((option, index) => {
                const [term, definition] = option.split("|")
                return (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <Checkbox
                      id={`match-${index}`}
                      checked={Array.isArray(currentAnswer) && currentAnswer.includes(term)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setCurrentAnswer((prev) => (Array.isArray(prev) ? [...prev, term] : [term]))
                        } else {
                          setCurrentAnswer((prev) => (Array.isArray(prev) ? prev.filter((item) => item !== term) : []))
                        }
                      }}
                    />
                    <Label htmlFor={`match-${index}`} className="cursor-pointer">
                      <strong>{term}</strong> - {definition}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )

      case "scenario":
        return (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm whitespace-pre-line">{question.question}</p>
            </div>
            <RadioGroup value={currentAnswer as string} onValueChange={setCurrentAnswer}>
              {question.options?.map((option, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option} id={`scenario-${index}`} className="mt-1" />
                  <Label htmlFor={`scenario-${index}`} className="text-sm leading-relaxed cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      default:
        return <p>Unknown question type</p>
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quiz...</p>
        </div>
      </div>
    )
  }

  if (!quiz) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
        <h3 className="text-lg font-medium mb-2">Quiz Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested quiz could not be loaded.</p>
        <Button onClick={onExit}>Return to Training</Button>
      </div>
    )
  }

  if (showResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5" />
              <span>Quiz Complete!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="text-4xl font-bold text-green-600">85%</div>
              <p className="text-lg">Congratulations! You passed the assessment.</p>
              {quiz.certification && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Certificate Earned!</span>
                  </div>
                  <p className="text-sm text-green-700">{quiz.certification.name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const canSubmit =
    currentAnswer &&
    ((typeof currentAnswer === "string" && currentAnswer.trim().length > 0) ||
      (Array.isArray(currentAnswer) && currentAnswer.length > 0))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>{quiz.title}</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {quiz.category} • {quiz.difficulty} level • Passing: {quiz.passingScore}%
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span className={`text-sm font-medium ${timeRemaining < 300 ? "text-red-600" : ""}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {quiz.questions.length}
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

      {/* Question Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {quiz.questions.map((_, index) => (
              <Button
                key={index}
                variant={
                  index === currentQuestionIndex
                    ? "default"
                    : responses.some((r) => r.questionId === quiz.questions[index].id)
                      ? "secondary"
                      : "outline"
                }
                size="sm"
                onClick={() => navigateToQuestion(index)}
                className="relative"
              >
                {index + 1}
                {flaggedQuestions.has(index) && <Flag className="h-3 w-3 absolute -top-1 -right-1 text-yellow-500" />}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                <span>Question {currentQuestionIndex + 1}</span>
              </CardTitle>
              <div className="flex items-center space-x-4 mt-2">
                <Badge variant="outline">{currentQuestion.category}</Badge>
                <Badge
                  variant={
                    currentQuestion.difficulty === "advanced"
                      ? "destructive"
                      : currentQuestion.difficulty === "intermediate"
                        ? "default"
                        : "secondary"
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
                <span className="text-sm text-muted-foreground">{currentQuestion.points} points</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleFlag(currentQuestionIndex)}
              className={flaggedQuestions.has(currentQuestionIndex) ? "text-yellow-600" : ""}
            >
              <Flag className="h-4 w-4 mr-2" />
              {flaggedQuestions.has(currentQuestionIndex) ? "Unflag" : "Flag"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {renderQuestion(currentQuestion)}

          {currentQuestion.type !== "essay" && (
            <div className="mt-6 pt-4 border-t">
              <Label className="text-sm font-medium">Confidence Level:</Label>
              <div className="flex items-center space-x-2 mt-2">
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

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigateToQuestion(currentQuestionIndex - 1)}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center space-x-2">
          <Button onClick={handleAnswerSubmit} disabled={!canSubmit} className="min-w-32">
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Quiz
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Next Question
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
