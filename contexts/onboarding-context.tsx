"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "./auth-context"

export type OnboardingStep = {
  id: string
  title: string
  description: string
  target: string // CSS selector
  placement?: "top" | "bottom" | "left" | "right" | "center"
  action?: "click" | "hover" | "none"
  page?: string // Optional page to navigate to
  delay?: number // Delay before showing this step
  spotlight?: boolean // Whether to use spotlight effect
  interactive?: boolean // Whether user must interact to continue
}

type OnboardingContextType = {
  isActive: boolean
  currentStep: number
  steps: OnboardingStep[]
  isCompleted: boolean
  startOnboarding: () => void
  nextStep: () => void
  prevStep: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
  setCurrentStep: (step: number) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Granular! 🎉",
    description: "Let's take a quick tour of your AI governance platform. This will only take 2 minutes.",
    target: "[data-onboarding='welcome-card']",
    placement: "center",
    action: "none",
    spotlight: true,
  },
  {
    id: "dashboard-overview",
    title: "Your Dashboard Overview",
    description:
      "Here you can see key metrics like connected agents, system efficiency, and performance scores at a glance.",
    target: "[data-onboarding='stats-cards']",
    placement: "bottom",
    action: "none",
    spotlight: true,
  },
  {
    id: "real-time-monitor",
    title: "Real-Time System Monitor",
    description:
      "Monitor your system's health with live CPU, memory, and network metrics. This updates every 30 seconds.",
    target: "[data-onboarding='real-time-monitor']",
    placement: "top",
    action: "none",
    spotlight: true,
  },
  {
    id: "analytics-tabs",
    title: "Advanced Analytics",
    description: "Dive deeper into your data with comprehensive analytics. Try clicking on different tabs to explore.",
    target: "[data-onboarding='analytics-tabs']",
    placement: "top",
    action: "click",
    interactive: true,
    spotlight: true,
  },
  {
    id: "sidebar-navigation",
    title: "Navigation Sidebar",
    description: "Your main navigation is organized into 4 key areas: Overview, Operations, Governance, and Access.",
    target: "[data-onboarding='sidebar']",
    placement: "right",
    action: "none",
    spotlight: true,
  },
  {
    id: "search-feature",
    title: "Powerful Search",
    description:
      "Search across pages, projects, and agents instantly. Try typing something or use ⌘K for the command palette.",
    target: "[data-onboarding='search-input']",
    placement: "bottom",
    action: "click",
    interactive: true,
    spotlight: true,
  },
  {
    id: "analytics-page",
    title: "Analytics Deep Dive",
    description: "Let's explore the analytics page where you can generate reports and view detailed insights.",
    target: "[data-onboarding='analytics-link']",
    placement: "right",
    action: "click",
    page: "/analytics",
    interactive: true,
    spotlight: true,
  },
  {
    id: "analytics-interface",
    title: "Advanced Analytics Interface",
    description:
      "This is your analytics command center. You can create custom reports, set up alerts, and analyze trends.",
    target: "[data-onboarding='analytics-interface']",
    placement: "center",
    action: "none",
    page: "/analytics",
    delay: 1000,
    spotlight: true,
  },
  {
    id: "compliance-reports",
    title: "Compliance & Governance",
    description: "Navigate to compliance reports to see how we help you maintain regulatory compliance.",
    target: "[data-onboarding='compliance-link']",
    placement: "right",
    action: "click",
    page: "/compliance-reports",
    interactive: true,
    spotlight: true,
  },
  {
    id: "user-management",
    title: "User & Role Management",
    description: "Manage your team's access and permissions from the Users & Roles section.",
    target: "[data-onboarding='users-link']",
    placement: "right",
    action: "click",
    page: "/users-roles",
    interactive: true,
    spotlight: true,
  },
  {
    id: "quick-actions",
    title: "Quick Actions Panel",
    description:
      "Access frequently used actions like connecting agents and creating projects right from your dashboard.",
    target: "[data-onboarding='quick-actions']",
    placement: "left",
    action: "none",
    page: "/",
    spotlight: true,
  },
  {
    id: "profile-menu",
    title: "Your Profile & Settings",
    description: "Access your account settings, billing, and preferences from your profile menu.",
    target: "[data-onboarding='profile-menu']",
    placement: "bottom",
    action: "click",
    interactive: true,
    spotlight: true,
  },
  {
    id: "completion",
    title: "You're All Set! 🚀",
    description:
      "Congratulations! You've completed the tour. You're now ready to start managing your AI governance with confidence.",
    target: "[data-onboarding='welcome-card']",
    placement: "center",
    action: "none",
    spotlight: true,
  },
]

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  // Check if user has completed onboarding
  useEffect(() => {
    if (user) {
      const completed = localStorage.getItem(`onboarding-completed-${user.id}`)
      setIsCompleted(!!completed)
    }
  }, [user])

  // Auto-start onboarding for new users
  useEffect(() => {
    if (user && !isCompleted) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding-seen-${user.id}`)
      if (!hasSeenOnboarding) {
        // Small delay to ensure page is fully loaded
        setTimeout(() => {
          setIsActive(true)
          localStorage.setItem(`onboarding-seen-${user.id}`, "true")
        }, 1500)
      }
    }
  }, [user, isCompleted])

  const startOnboarding = () => {
    setIsActive(true)
    setCurrentStep(0)
  }

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      completeOnboarding()
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const skipOnboarding = () => {
    setIsActive(false)
    completeOnboarding()
  }

  const completeOnboarding = () => {
    setIsActive(false)
    setIsCompleted(true)
    if (user) {
      localStorage.setItem(`onboarding-completed-${user.id}`, "true")
    }
  }

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        steps: ONBOARDING_STEPS,
        isCompleted,
        startOnboarding,
        nextStep,
        prevStep,
        skipOnboarding,
        completeOnboarding,
        setCurrentStep,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider")
  }
  return context
}
