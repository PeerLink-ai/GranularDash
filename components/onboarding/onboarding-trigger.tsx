"use client"
import { Button } from "@/components/ui/button"
import { HelpCircle, Play } from "lucide-react"
import { useOnboarding } from "@/contexts/onboarding-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function OnboardingTrigger() {
  const { startOnboarding, isCompleted } = useOnboarding()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={startOnboarding} className="gap-2">
          <Play className="h-4 w-4" />
          {isCompleted ? "Restart Tour" : "Take Product Tour"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
