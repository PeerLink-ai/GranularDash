"use client"

import { useAuth } from "@/contexts/auth-context"
import { SignInForm } from "@/components/sign-in-form"
import { DashboardOverview } from "@/components/dashboard-overview"
import { OnboardingModal } from "@/components/onboarding-modal"
import { useState, useEffect } from "react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (user && !user.onboarding_completed) {
      setShowOnboarding(true)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <SignInForm />
  }

  return (
    <>
      <DashboardOverview />
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </>
  )
}
