"use client"

import { useState, useEffect } from "react"
import { ModernLoader } from "./modern-loader"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, User, Shield, Sparkles } from "lucide-react"

interface AccountCreationLoaderProps {
  isVisible: boolean
  onComplete?: () => void
}

const creationSteps = [
  { id: 1, label: "Creating your account", icon: User, duration: 2000 },
  { id: 2, label: "Setting up security", icon: Shield, duration: 1500 },
  { id: 3, label: "Personalizing experience", icon: Sparkles, duration: 1000 },
  { id: 4, label: "Almost ready!", icon: CheckCircle, duration: 500 },
]

export function AccountCreationLoader({ isVisible, onComplete }: AccountCreationLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0)
      setProgress(0)
      setCompletedSteps([])
      return
    }

    let totalDuration = 0
    let currentDuration = 0

    const stepTimers = creationSteps.map((step, index) => {
      totalDuration += step.duration
      const stepStart = currentDuration
      currentDuration += step.duration

      return setTimeout(() => {
        setCurrentStep(index)
        setCompletedSteps((prev) => [...prev, step.id])

        // Animate progress
        const progressTimer = setInterval(() => {
          setProgress((prev) => {
            const targetProgress = ((stepStart + step.duration) / totalDuration) * 100
            const newProgress = Math.min(prev + 2, targetProgress)

            if (newProgress >= targetProgress) {
              clearInterval(progressTimer)
              if (index === creationSteps.length - 1) {
                setTimeout(() => onComplete?.(), 500)
              }
            }

            return newProgress
          })
        }, 50)
      }, stepStart)
    })

    return () => {
      stepTimers.forEach((timer) => clearTimeout(timer))
    }
  }, [isVisible, onComplete])

  if (!isVisible) return null

  const currentStepData = creationSteps[currentStep]

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4 border-0 shadow-2xl">
        <CardContent className="p-8 text-center space-y-8">
          {/* Main Loader */}
          <div className="flex justify-center">
            <ModernLoader
              variant="morphing"
              size="xl"
              showProgress={true}
              progress={progress}
              message={currentStepData?.label}
            />
          </div>

          {/* Step Indicators */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Setting up your account</h3>

            <div className="space-y-3">
              {creationSteps.map((step) => {
                const Icon = step.icon
                const isCompleted = completedSteps.includes(step.id)
                const isCurrent = currentStep === step.id - 1

                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                      isCurrent ? "bg-primary/10 border border-primary/20" : isCompleted ? "bg-muted/50" : "opacity-50"
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                            ? "bg-primary/20 text-primary animate-pulse"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>

                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>

                    {isCurrent && (
                      <div className="flex-1 flex justify-end">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Artistic Elements */}
          <div className="relative">
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-accent/20 rounded-full animate-floating-particles" />
            <div
              className="absolute -bottom-2 -left-2 w-6 h-6 bg-primary/20 rounded-full animate-floating-particles"
              style={{ animationDelay: "1s" }}
            />
            <div
              className="absolute top-0 left-1/2 w-4 h-4 bg-secondary/20 rounded-full animate-floating-particles"
              style={{ animationDelay: "2s" }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
