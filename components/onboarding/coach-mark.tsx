"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  X,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  Sparkles,
  CheckCircle,
  Rocket,
  MousePointer,
  Eye,
  Focus,
  Scroll,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { OnboardingStep } from "@/contexts/onboarding-context"

type CoachMarkProps = {
  step: OnboardingStep
  stepNumber: number
  totalSteps: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isVisible: boolean
}

export function CoachMark({ step, stepNumber, totalSteps, onNext, onPrev, onSkip, isVisible }: CoachMarkProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom" | "left" | "right" | "center">("bottom")
  const [interactionCompleted, setInteractionCompleted] = useState(false)
  const [showCompletionFeedback, setShowCompletionFeedback] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!targetElement || !isVisible) return

    const updatePosition = () => {
      const rect = targetElement.getBoundingClientRect()
      setPosition({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      })
    }

    const handleScroll = () => updatePosition()
    const handleResize = () => updatePosition()

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)

    updatePosition()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [targetElement, isVisible])

  useEffect(() => {
    if (!isVisible) return

    const findTarget = () => {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        setTargetElement(element)
        const rect = element.getBoundingClientRect()
        setPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        })
        calculateTooltipPosition(rect)
      } else {
        setTimeout(findTarget, 100)
      }
    }

    if (step.delay) {
      setTimeout(findTarget, step.delay)
    } else {
      findTarget()
    }
  }, [step.target, step.delay, isVisible])

  const calculateTooltipPosition = (rect: DOMRect) => {
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const tooltipWidth = 400
    const tooltipHeight = 250
    const gap = 20

    if (step.placement === "center") {
      setTooltipPosition("center")
    } else if (step.placement) {
      setTooltipPosition(step.placement)
    } else {
      const elementCenter = rect.top + rect.height / 2
      const elementMiddle = rect.left + rect.width / 2

      const canPlaceTop = rect.top - tooltipHeight - gap > 0
      const canPlaceBottom = rect.bottom + tooltipHeight + gap < viewportHeight
      const canPlaceLeft = rect.left - tooltipWidth - gap > 0
      const canPlaceRight = rect.right + tooltipWidth + gap < viewportWidth

      if (canPlaceBottom && elementCenter < viewportHeight / 2) {
        setTooltipPosition("bottom")
      } else if (canPlaceTop && elementCenter >= viewportHeight / 2) {
        setTooltipPosition("top")
      } else if (canPlaceRight && elementMiddle < viewportWidth / 2) {
        setTooltipPosition("right")
      } else if (canPlaceLeft && elementMiddle >= viewportWidth / 2) {
        setTooltipPosition("left")
      } else {
        setTooltipPosition("center")
      }
    }
  }

  useEffect(() => {
    if (!targetElement || !step.interactive) return

    const handleInteraction = (e: Event) => {
      if (!interactionCompleted) {
        console.log("[v0] Interaction detected:", step.action, step.target)
        setInteractionCompleted(true)
        setShowCompletionFeedback(true)

        setTimeout(() => {
          setShowCompletionFeedback(false)
          if (step.action === "click") {
            setTimeout(onNext, 100)
          }
        }, 1000)
      }
    }

    const handleScroll = () => {
      if (step.action === "scroll" && !interactionCompleted) {
        handleInteraction(new Event("scroll"))
      }
    }

    if (step.action === "click") {
      targetElement.addEventListener("click", handleInteraction, { capture: true })
      targetElement.addEventListener("mousedown", handleInteraction, { capture: true })
    } else if (step.action === "hover") {
      targetElement.addEventListener("mouseenter", handleInteraction)
      targetElement.addEventListener("mouseover", handleInteraction)
    } else if (step.action === "focus") {
      targetElement.addEventListener("focus", handleInteraction)
      targetElement.addEventListener("click", handleInteraction)
    } else if (step.action === "scroll") {
      window.addEventListener("scroll", handleScroll, { passive: true })
    }

    return () => {
      if (step.action === "click") {
        targetElement.removeEventListener("click", handleInteraction, { capture: true })
        targetElement.removeEventListener("mousedown", handleInteraction, { capture: true })
      } else if (step.action === "hover") {
        targetElement.removeEventListener("mouseenter", handleInteraction)
        targetElement.removeEventListener("mouseover", handleInteraction)
      } else if (step.action === "focus") {
        targetElement.removeEventListener("focus", handleInteraction)
        targetElement.removeEventListener("click", handleInteraction)
      } else if (step.action === "scroll") {
        window.removeEventListener("scroll", handleScroll)
      }
    }
  }, [targetElement, step.interactive, step.action, interactionCompleted, onNext])

  useEffect(() => {
    setInteractionCompleted(false)
    setShowCompletionFeedback(false)
  }, [step.id])

  useEffect(() => {
    if (targetElement && isVisible && !step.isWelcome && !step.isCompletion) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      })
    }
  }, [targetElement, isVisible, step.isWelcome, step.isCompletion])

  if (!isVisible) return null

  if (step.isWelcome || step.isCompletion) {
    return createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center">
        <div className="absolute inset-0 bg-background/90" />

        <Card className="w-[500px] max-w-[90vw] shadow-2xl border bg-card animate-in fade-in-0 zoom-in-95 duration-500">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted shadow-lg">
                {step.isWelcome ? (
                  <Sparkles className="h-8 w-8 text-foreground" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-foreground" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">{step.title}</CardTitle>
            {step.isWelcome && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary">Interactive Tour</Badge>
                <Badge variant="secondary">2 minutes</Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground leading-relaxed mb-6 text-base">{step.description}</p>

            {step.isCompletion && (
              <div className="mb-6 p-4 bg-muted rounded-lg border">
                <div className="flex items-center justify-center gap-2 text-foreground font-medium">
                  <Rocket className="h-4 w-4" />
                  Ready to explore your AI governance platform!
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3">
              {step.isWelcome ? (
                <>
                  <Button variant="outline" onClick={onSkip} className="gap-2 bg-transparent">
                    <SkipForward className="h-4 w-4" />
                    Skip Tour
                  </Button>
                  <Button onClick={onNext} className="gap-2">
                    Start Interactive Tour
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={onNext} className="gap-2">
                  Get Started
                  <Rocket className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>,
      document.body,
    )
  }

  if (!targetElement) return null

  const getTooltipStyle = () => {
    const tooltipWidth = 400
    const tooltipHeight = 250
    const gap = 20
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    switch (tooltipPosition) {
      case "center":
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          position: "fixed" as const,
        }
      case "top":
        return {
          top: Math.max(20, position.top - tooltipHeight - gap),
          left: Math.min(
            Math.max(20, position.left + position.width / 2 - tooltipWidth / 2),
            viewportWidth - tooltipWidth - 20,
          ),
          transform: "none",
          position: "fixed" as const,
        }
      case "bottom":
        return {
          top: Math.min(position.top + position.height + gap, viewportHeight - tooltipHeight - 20),
          left: Math.min(
            Math.max(20, position.left + position.width / 2 - tooltipWidth / 2),
            viewportWidth - tooltipWidth - 20,
          ),
          transform: "none",
          position: "fixed" as const,
        }
      case "left":
        return {
          top: Math.min(
            Math.max(20, position.top + position.height / 2 - tooltipHeight / 2),
            viewportHeight - tooltipHeight - 20,
          ),
          left: Math.max(20, position.left - tooltipWidth - gap),
          transform: "none",
          position: "fixed" as const,
        }
      case "right":
        return {
          top: Math.min(
            Math.max(20, position.top + position.height / 2 - tooltipHeight / 2),
            viewportHeight - tooltipHeight - 20,
          ),
          left: Math.min(position.left + position.width + gap, viewportWidth - tooltipWidth - 20),
          transform: "none",
          position: "fixed" as const,
        }
      default:
        return {
          top: Math.min(position.top + position.height + gap, viewportHeight - tooltipHeight - 20),
          left: Math.min(
            Math.max(20, position.left + position.width / 2 - tooltipWidth / 2),
            viewportWidth - tooltipWidth - 20,
          ),
          transform: "none",
          position: "fixed" as const,
        }
    }
  }

  const progress = ((stepNumber + 1) / totalSteps) * 100

  const getInteractionIcon = () => {
    switch (step.action) {
      case "click":
        return <MousePointer className="h-4 w-4" />
      case "hover":
        return <Eye className="h-4 w-4" />
      case "focus":
        return <Focus className="h-4 w-4" />
      case "scroll":
        return <Scroll className="h-4 w-4" />
      default:
        return <Sparkles className="h-4 w-4" />
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-background/70 transition-all duration-500"
        onClick={tooltipPosition === "center" ? undefined : onNext}
      />

      <div
        className="fixed pointer-events-none transition-all duration-300 ease-out rounded-lg"
        style={{
          top: position.top - 4,
          left: position.left - 4,
          width: position.width + 8,
          height: position.height + 8,
          border: "3px solid hsl(var(--foreground))",
          boxShadow: `0 0 0 1px hsl(var(--background)), 0 0 20px hsl(var(--foreground) / 0.3)`,
          animation: "pulse 2s infinite",
        }}
      />

      {step.interactive && !interactionCompleted && (
        <div
          className="fixed pointer-events-none z-10"
          style={{
            top: position.top + position.height / 2 - 12,
            left: position.left + position.width / 2 - 12,
          }}
        >
          <div className="w-6 h-6 bg-foreground rounded-full animate-ping opacity-75" />
          <div className="absolute inset-0 w-6 h-6 bg-foreground/80 rounded-full animate-pulse" />
          <div className="absolute inset-2 w-2 h-2 bg-background rounded-full" />
        </div>
      )}

      {interactionCompleted && showCompletionFeedback && (
        <div
          className="fixed pointer-events-none animate-in zoom-in-50 duration-300 z-10"
          style={{
            top: position.top + position.height / 2 - 16,
            left: position.left + position.width / 2 - 16,
          }}
        >
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <CheckCircle className="h-5 w-5 text-white" />
          </div>
        </div>
      )}

      <Card
        ref={tooltipRef}
        className={cn(
          "w-[400px] max-w-[90vw] shadow-2xl border bg-card transition-all duration-300 ease-out",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
          tooltipPosition === "center" && "max-w-md",
        )}
        style={getTooltipStyle()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                {getInteractionIcon()}
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-card-foreground">{step.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Step {stepNumber + 1} of {totalSteps}
                  </Badge>
                  <Progress value={progress} className="w-16 h-1" />
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSkip} className="h-8 w-8 p-0 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.description}</p>

          {step.interactive && (
            <div
              className={cn(
                "mb-4 p-3 rounded-lg border transition-all duration-300",
                interactionCompleted
                  ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                  : "bg-muted",
              )}
            >
              {showCompletionFeedback ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <p className="text-xs font-medium text-green-700 dark:text-green-300">
                    {step.completionText || "Great! Interaction completed."}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {getInteractionIcon()}
                  <p className="text-xs font-medium text-foreground">
                    {step.hintText ||
                      (step.action === "click"
                        ? "👆 Click the highlighted element to continue"
                        : step.action === "hover"
                          ? "👆 Hover over the highlighted element"
                          : step.action === "focus"
                            ? "👆 Click or focus on the highlighted element"
                            : step.action === "scroll"
                              ? "👆 Scroll to explore this section"
                              : "Interact with the highlighted element")}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {stepNumber > 0 && (
                <Button variant="outline" size="sm" onClick={onPrev} className="gap-1 bg-transparent">
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onSkip} className="gap-1 text-muted-foreground">
                <SkipForward className="h-3 w-3" />
                Skip Tour
              </Button>
            </div>
            {(!step.interactive || (step.interactive && interactionCompleted && !showCompletionFeedback)) && (
              <Button onClick={onNext} size="sm" className="gap-1">
                {stepNumber === totalSteps - 1 ? "Complete" : "Next"}
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>,
    document.body,
  )
}
