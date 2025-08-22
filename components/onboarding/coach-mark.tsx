"use client"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { X, ArrowRight, ArrowLeft, SkipForward, Sparkles } from "lucide-react"
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
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

    setPosition({
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
    })

    // Calculate tooltip position based on element location and preference
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const elementCenter = rect.top + rect.height / 2
    const elementMiddle = rect.left + rect.width / 2

    if (step.placement === "center") {
      setTooltipPosition("center")
    } else if (step.placement) {
      setTooltipPosition(step.placement)
    } else {
      // Auto-calculate best position
      if (elementCenter < viewportHeight / 3) {
        setTooltipPosition("bottom")
      } else if (elementCenter > (viewportHeight * 2) / 3) {
        setTooltipPosition("top")
      } else if (elementMiddle < viewportWidth / 2) {
        setTooltipPosition("right")
      } else {
        setTooltipPosition("left")
      }
    }
  }

  // Handle window resize
  useEffect(() => {
    if (!targetElement) return

    const handleResize = () => updatePosition(targetElement)
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
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
    if (targetElement && isVisible) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      })
    }
  }, [targetElement, isVisible])

  if (!isVisible || !targetElement) return null

  const targetRect = targetElement.getBoundingClientRect()
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

  const getTooltipStyle = () => {
    const tooltipWidth = 400
    const tooltipHeight = 200
    const gap = 20

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
          top: position.top - tooltipHeight - gap,
          left: Math.max(20, position.left + targetRect.width / 2 - tooltipWidth / 2),
          transform: "none",
        }
      case "bottom":
        return {
          top: position.top + targetRect.height + gap,
          left: Math.max(20, position.left + targetRect.width / 2 - tooltipWidth / 2),
          transform: "none",
        }
      case "left":
        return {
          top: position.top + targetRect.height / 2 - tooltipHeight / 2,
          left: Math.max(20, position.left - tooltipWidth - gap),
          transform: "none",
        }
      case "right":
        return {
          top: position.top + targetRect.height / 2 - tooltipHeight / 2,
          left: position.left + targetRect.width + gap,
          transform: "none",
        }
      default:
        return {
          top: position.top + targetRect.height + gap,
          left: Math.max(20, position.left + targetRect.width / 2 - tooltipWidth / 2),
          transform: "none",
        }
    }
  }

  const progress = ((stepNumber + 1) / totalSteps) * 100

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop with spotlight effect */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500"
        style={{
          background: step.spotlight
            ? `radial-gradient(circle at ${position.left + targetRect.width / 2}px ${
                position.top + targetRect.height / 2
              }px, transparent 0px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + 20}px, rgba(0,0,0,0.7) ${
                Math.max(targetRect.width, targetRect.height) / 2 + 60
              }px)`
            : "rgba(0,0,0,0.6)",
        }}
        onClick={tooltipPosition === "center" ? undefined : onNext}
      />

      {/* Highlight ring around target */}
      {step.spotlight && (
        <div
          className="absolute pointer-events-none transition-all duration-500 ease-out"
          style={{
            top: position.top - 8,
            left: position.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
            borderRadius: "12px",
            boxShadow: `
              0 0 0 4px rgba(59, 130, 246, 0.5),
              0 0 0 8px rgba(59, 130, 246, 0.3),
              0 0 20px rgba(59, 130, 246, 0.4),
              inset 0 0 0 2px rgba(255, 255, 255, 0.1)
            `,
            background: "transparent",
          }}
        />
      )}

      {/* Pulsing dot for interactive elements */}
      {step.interactive && step.action === "click" && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: position.top + targetRect.height / 2 - 6,
            left: position.left + targetRect.width / 2 - 6,
          }}
        >
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping" />
          <div className="absolute inset-0 w-3 h-3 bg-blue-400 rounded-full animate-pulse" />
        </div>
      )}

      {/* Tooltip */}
      <Card
        ref={tooltipRef}
        className={cn(
          "absolute w-[400px] max-w-[90vw] shadow-2xl border-2 border-blue-500/20 bg-background/95 backdrop-blur-md transition-all duration-500 ease-out",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2",
          tooltipPosition === "center" && "max-w-md",
        )}
        style={getTooltipStyle()}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{step.title}</CardTitle>
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
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
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
                className="gap-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
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
