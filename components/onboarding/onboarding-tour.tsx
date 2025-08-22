"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { CoachMark } from "./coach-mark"
import { useOnboarding } from "@/contexts/onboarding-context"

export function OnboardingTour() {
  const router = useRouter()
  const pathname = usePathname()
  const { isActive, currentStep, steps, nextStep, prevStep, skipOnboarding } = useOnboarding()

  const currentStepData = steps[currentStep]

  // Handle page navigation for steps that require it
  useEffect(() => {
    if (!isActive || !currentStepData) return

    if (currentStepData.page && pathname !== currentStepData.page) {
      router.push(currentStepData.page)
    }
  }, [currentStep, currentStepData, pathname, router, isActive])

  if (!isActive || !currentStepData) return null

  return (
    <CoachMark
      step={currentStepData}
      stepNumber={currentStep}
      totalSteps={steps.length}
      onNext={nextStep}
      onPrev={prevStep}
      onSkip={skipOnboarding}
      isVisible={isActive}
    />
  )
}
