"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, ArrowRight, ArrowLeft, SkipForward, Sparkles, CheckCircle, Rocket } from "lucide-react"
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
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [tooltipPosition, setTooltipPosition] = useState<"top" | "bottom" | "left" | "right" | "center">("bottom")
  const overlayRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Find target element and calculate position
  useEffect(() => {
    if (!isVisible) return

    const findTarget = () => {
      const element = document.querySelector(step.target) as HTMLElement
      if (element) {
        setTargetElement(element)
        updatePosition(element)
      } else {
        // Retry after a short delay if element not found
        setTimeout(findTarget, 100)
      }
    }

    // Add delay if specified
    if (step.delay) {
      setTimeout(findTarget, step.delay)
    } else {
      findTarget()
    }
  }, [step.target, step.delay, isVisible])

  const updatePosition = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    setPosition({
      top: rect.top,
      left: rect.left,
    })

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
      // Auto-calculate best position with overflow prevention
      const elementCenter = rect.top + rect.height / 2
      const elementMiddle = rect.left + rect.width / 2

      // Check if tooltip would overflow on each side
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
        // Fallback to center if no good position
        setTooltipPosition("center")
      }
    }
  }

  // Handle window resize and scroll
  useEffect(() => {
    if (!targetElement) return

    const handleScroll = () => updatePosition(targetElement)
    const handleResize = () => updatePosition(targetElement)

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleResize)
    }
  }, [targetElement])

  // Handle interactive elements
  useEffect(() => {
    if (!targetElement || !step.interactive) return

    const handleInteraction = (e: Event) => {
      if (step.action === "click") {
        // Allow the click to proceed, then advance
        setTimeout(onNext, 100)
      }
    }

    if (step.action === "click") {
      targetElement.addEventListener("click", handleInteraction)
    } else if (step.action === "hover") {
      targetElement.addEventListener("mouseenter", handleInteraction)
    }

    return () => {
      if (step.action === "click") {
        targetElement.removeEventListener("click", handleInteraction)
      } else if (step.action === "hover") {
        targetElement.removeEventListener("mouseenter", handleInteraction)
      }
    }
  }, [targetElement, step.interactive, step.action, onNext])

  // Scroll target into view
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background/80 to-accent/20 backdrop-blur-sm" />

        <Card className="w-[500px] max-w-[90vw] shadow-2xl border-0 bg-gradient-to-br from-card via-card to-card/95 backdrop-blur-md animate-in fade-in-0 zoom-in-95 duration-500">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-lg">
                {step.isWelcome ? (
                  <Sparkles className="h-8 w-8 text-primary-foreground" />
                ) : (
                  <CheckCircle className="h-8 w-8 text-primary-foreground" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {step.title}
            </CardTitle>
            {step.isWelcome && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  Quick Tour
                </Badge>
                <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">
                  2 minutes
                </Badge>
              </div>
            )}
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground leading-relaxed mb-6 text-base">{step.description}</p>

            {step.isCompletion && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg border border-primary/20">
                <div className="flex items-center justify-center gap-2 text-primary font-medium">
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
                  <Button
                    onClick={onNext}
                    className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                  >
                    Start Tour
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={onNext}
                  className="gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
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

  const targetRect = targetElement.getBoundingClientRect()

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
            Math.max(20, position.left + targetRect.width / 2 - tooltipWidth / 2),
            viewportWidth - tooltipWidth - 20,
          ),
          transform: "none",
          position: "fixed" as const,
        }
      case "bottom":
        return {
          top: Math.min(position.top + targetRect.height + gap, viewportHeight - tooltipHeight - 20),
          left: Math.min(
            Math.max(20, position.left + targetRect.width / 2 - tooltipWidth / 2),
            viewportWidth - tooltipWidth - 20,
          ),
          transform: "none",
          position: "fixed" as const,
        }
      case "left":
        return {
          top: Math.min(
            Math.max(20, position.top + targetRect.height / 2 - tooltipHeight / 2),
            viewportHeight - tooltipHeight - 20,
          ),
          left: Math.max(20, position.left - tooltipWidth - gap),
          transform: "none",
          position: "fixed" as const,
        }
      case "right":
        return {
          top: Math.min(
            Math.max(20, position.top + targetRect.height / 2 - tooltipHeight / 2),
            viewportHeight - tooltipHeight - 20,
          ),
          left: Math.min(position.left + targetRect.width + gap, viewportWidth - tooltipWidth - 20),
          transform: "none",
          position: "fixed" as const,
        }
      default:
        return {
          top: Math.min(position.top + targetRect.height + gap, viewportHeight - tooltipHeight - 20),
          left: Math.min(
            Math.max(20, position.left + targetRect.width / 2 - tooltipWidth / 2),
            viewportWidth - tooltipWidth - 20,
          ),
          transform: "none",
          position: "fixed" as const,
        }
    }
  }

  const progress = ((stepNumber + 1) / totalSteps) * 100

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-background/60 backdrop-blur-[2px] transition-all duration-500"
        onClick={tooltipPosition === "center" ? undefined : onNext}
      />

      <div
        className="fixed pointer-events-none transition-all duration-300 ease-out border-3 border-primary rounded-lg shadow-lg"
        style={{
          top: position.top - 3,
          left: position.left - 3,
          width: targetRect.width + 6,
          height: targetRect.height + 6,
          boxShadow: `
            0 0 0 1px hsl(var(--primary) / 0.3),
            0 4px 12px hsl(var(--primary) / 0.15)
          `,
        }}
      />

      {/* Pulsing dot for interactive elements */}
      {step.interactive && step.action === "click" && (
        <div
          className="fixed pointer-events-none"
          style={{
            top: position.top + targetRect.height / 2 - 6,
            left: position.left + targetRect.width / 2 - 6,
          }}
        >
          <div className="w-3 h-3 bg-primary rounded-full animate-ping" />
          <div className="absolute inset-0 w-3 h-3 bg-primary/60 rounded-full animate-pulse" />
        </div>
      )}

      <Card
        ref={tooltipRef}
        className={cn(
          "w-[400px] max-w-[90vw] shadow-2xl border border-border bg-card/95 backdrop-blur-sm transition-all duration-300 ease-out",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
          tooltipPosition === "center" && "max-w-md",
        )}
        style={getTooltipStyle()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-card-foreground">{step.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
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
            <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-xs font-medium text-primary">
                {step.action === "click"
                  ? "👆 Click the highlighted element to continue"
                  : "Interact with the highlighted element"}
              </p>
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
            {!step.interactive && (
              <Button
                onClick={onNext}
                size="sm"
                className="gap-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
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
