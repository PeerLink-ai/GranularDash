"use client"

import { Button } from "@/components/ui/button"
import { useOnboarding } from "@/contexts/onboarding-context"
import { Play } from "lucide-react"

export function OnboardingTestButton() {
  const { startOnboarding } = useOnboarding()

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={startOnboarding}
      className="gap-2 fixed bottom-4 right-4 z-50 shadow-lg bg-card border"
    >
      <Play className="h-4 w-4" />
      Test Onboarding
    </Button>
  )
}
